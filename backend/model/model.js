import db from '../database.js';
const parseJSON = (value) => 
    typeof value === "string" ? JSON.parse(value) : value;
const SEARCH_CATEGORIES = ["username", "schoolid", "email", "role", "section", "department"];
const EVENT_FIELDS = {
  name:       "event_name",
  details:    "event_details",
  type:       "event_type",
  date:       "JSON_UNQUOTE(JSON_EXTRACT(event_schedule, '$.eventDate'))",
  location:   "JSON_UNQUOTE(JSON_EXTRACT(event_schedule, '$.location'))",
  year:       "JSON_EXTRACT(required_parameters, '$.year')",
  section:    "JSON_EXTRACT(required_parameters, '$.section')",
  department: "JSON_EXTRACT(required_parameters, '$.department')",
};

const DATE_SORT = "STR_TO_DATE(REPLACE(JSON_UNQUOTE(JSON_EXTRACT(event_schedule, '$.eventDate')), '.', ''), '%b %e, %Y')";

const model = {

    registerUser: async (userData) => {
        try {

            const { schoolid, username, password, email, role, year, section, department} = userData;
            const [result] = await db.query(
                "INSERT INTO tbl_user (schoolid, username, password, email, role, year, section, department, events_participating_in) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [schoolid, username, password, email, role, year, section, department, '{}']
            );
            return { id: result.insertId, schoolid, username, password, email, role, year, section, department};
        } catch (error) {
            throw error;
        }
    },

    loginUser: async (loginData) => {
        try {
            const { schoolid, password, role } = loginData;
            const [result] = await db.query(
                "SELECT * FROM tbl_user WHERE schoolid = ? AND password = ? AND role = ?",
                [schoolid, password, role]
            );
            return result[0]; 
        } catch (error) {
            throw error;
        }
    },

    getAllUsers: async () => {
        try {
            const [result] = await db.query("SELECT * FROM tbl_user");
            return result;
        } catch (error) {
            throw error;
        }
    },

    searchForUser: async (searchTerm) => {  
        try {
            const [result] = await db.query(
                "SELECT * FROM tbl_user WHERE username LIKE ? OR email LIKE ?",
                [`%${searchTerm}%`, `%${searchTerm}%`]
            );
            return result;
        } catch (error) {
            throw error;
        }
    },

    

    createEvent: async ({ creatorId, name, details, schedule, requiredParameters, visibility, type }) => {
  const connection = await db.getConnection(); // works with a mysql2 pool
  try {
    await connection.beginTransaction();

    // 1. Create the event
    const [result] = await connection.query(
      `INSERT INTO tbl_event
         (event_name, event_creator_id, event_details, event_schedule,
          required_parameters, event_visibility, event_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        creatorId,
        details,
        JSON.stringify(schedule),
        JSON.stringify(requiredParameters),
        visibility,
        type,
      ]
    );
    const eventId = result.insertId;

    // 2. Find matching students. Empty = not required, so no one is auto-added
    //    unless at least one category has values.
    const { year, section, department } = requiredParameters;
    const hasAnyRequirement = year.length || section.length || department.length;

    let students = [];

    if (hasAnyRequirement) {
    let sql = `SELECT schoolid FROM tbl_user WHERE role = 'student'`;
    const params = [];

    if (year.length) {
        sql += ` AND year IN (?)`;
        params.push(year);
    }
    if (section.length) {
        sql += ` AND section IN (?)`;
        params.push(section);
    }
    if (department.length) {
        sql += ` AND department IN (?)`;
        params.push(department);
    }

    [students] = await connection.query(sql, params);
    }

    // 3. Build the participant array in your existing format
    const participants = students.map((s) => ({
      userID: s.schoolid,
      attendance: "pending",
      timeIn: null,
      timeOut: null,
    }));

    // 4. Save it, one row per event
    await connection.query(
      `INSERT INTO tbl_event_participants (event_id, event_participants)
       VALUES (?, ?)`,
      [eventId, JSON.stringify(participants)]
    );

    await connection.commit();
    return { eventId, participantCount: participants.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
},

    getAllEvents: async (query = "", category = "all", order = "asc") => {
        try {
            const isValid = Object.hasOwn(EVENT_FIELDS, category);
            const direction = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";
            const sortExpr = category === "date" ? DATE_SORT : (isValid ? EVENT_FIELDS[category] : EVENT_FIELDS.name);

            let sql = `SELECT id, event_name, event_details, event_schedule,
                            required_parameters, event_visibility, event_type
                    FROM tbl_event
                    WHERE event_visibility = 'Open'`;
            const params = [];

            if (query) {
            if (isValid) {
                sql += ` AND ${EVENT_FIELDS[category]} LIKE ?`;
                params.push(`%${query}%`);
            } else {
                // "all": match any searchable field
                const fields = Object.values(EVENT_FIELDS);
                sql += ` AND (` + fields.map((f) => `${f} LIKE ?`).join(" OR ") + `)`;
                fields.forEach(() => params.push(`%${query}%`));
            }
            }

            sql += ` ORDER BY ${sortExpr} ${direction}`;

            const [rows] = await db.query(sql, params);

            return rows.map((row) => ({
            id: row.id,
            event_name: row.event_name,
            event_details: row.event_details,
            event_type: row.event_type,
            event_schedule: parseJSON(row.event_schedule),
            required_parameters: parseJSON(row.required_parameters),
            }));
        } catch (error) {
            throw error;
        }
        },

    searchForEvent: async (searchTerm) => {
        try {
            const [result] = await db.query(                                                            //  eventName;       eventDetails;      eventSchedule, eventVisibility, eventType; ASC or DESC
                'SELECT * FROM tbl_event WHERE event_name LIKE ? OR event_details LIKE ? ORDER BY ? ?', [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
            );
            return result;
        } catch (error) {
            throw error;
        }
    },

    getEventById: async (eventId) => {
    try {
        const [rows] = await db.query(
        `SELECT id, event_name, event_details, event_schedule,
                required_parameters, event_visibility, event_type
        FROM tbl_event
        WHERE id = ?`,
        [eventId]
        );

        if (!rows.length) return null;

        const row = rows[0];
        return {
        id: row.id,
        event_name: row.event_name,
        event_details: row.event_details,
        event_type: row.event_type,
        event_visibility: row.event_visibility,
        event_schedule: parseJSON(row.event_schedule),
        required_parameters: parseJSON(row.required_parameters),
        };
    } catch (error) {
        throw error;
    }
    },


    getAllParticipants: async (eventId) => {
        try {
            const [result] = await db.query(
                "SELECT * FROM tbl_event_participants WHERE event_id = ?",
                [eventId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    },

    searchUsers: async (query, category, order) => {
        try {
        const isValidCategory = SEARCH_CATEGORIES.includes(category);
        const sortColumn = isValidCategory ? category : "username";
        const direction = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";

        let sql = `SELECT id, schoolid, username, email, role, year, section, department
                    FROM tbl_user`;
        const params = [];

        if (query) {
            if (isValidCategory) {
            sql += ` WHERE ${category} LIKE ?`;
            params.push(`%${query}%`);
            } else {
            // "all" categories: match any searchable column
            sql += ` WHERE ` + SEARCH_CATEGORIES.map((c) => `${c} LIKE ?`).join(" OR ");
            SEARCH_CATEGORIES.forEach(() => params.push(`%${query}%`));
            }
        }

        sql += ` ORDER BY ${sortColumn} ${direction}`;

        const [rows] = await db.query(sql, params);
        return rows;
        } catch (error) {
        throw error;
        }
    },

    searchEventsByUserID: async (userID) => {
    try {
      const [rows] = await db.query(
        `SELECT ep.event_id, ep.event_participants, e.event_name, e.event_schedule, e.required_parameters
        FROM tbl_event_participants ep
        JOIN tbl_event e ON e.id = ep.event_id
        WHERE JSON_CONTAINS(ep.event_participants, JSON_OBJECT('userID', ?))`,
        [userID]
      );

      return rows.map((row) => {
        const participants = parseJSON(row.event_participants);
        const me = participants.find((p) => p.userID === userID);
        const params = parseJSON(row.required_parameters);

        return {
            event_id: row.event_id,
            event_name: row.event_name,
            event_schedule: parseJSON(row.event_schedule),
            department: params?.department ?? "N/A",
            attendance: me?.attendance ?? null,
        };
      });
    } catch (error) {
      throw error;
    }
  },
    
    participantsTimeInOutHandler: async (eventId, participantId, timeIn, timeOut) => {
        try {
            const [result] = await db.query(
                "UPDATE tbl_event_participants SET time_in = ?, time_out = ? WHERE event_id = ? AND participant_id = ?",
                [timeIn, timeOut, eventId, participantId]
            );
            return result;
        } catch (error) {
            throw error;
        }
    },

    removeParticipants: async (eventId, participantIds) => {
        try {
            const [result] = await db.query(
                "DELETE FROM tbl_event_participants WHERE event_id = ? AND participant_id IN (?)",
                [eventId, participantIds]
            );
            return result;
        } catch (error) {
            throw error;
        }
    },

   registerParticipant: async (eventId, schoolId) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Event must exist and be Open
        const [events] = await connection.query(
        "SELECT event_visibility FROM tbl_event WHERE id = ?",
        [eventId]
        );
        if (!events.length) {
        await connection.rollback();
        return { status: "event_not_found" };
        }
        if (events[0].event_visibility !== "Open") {
        await connection.rollback();
        return { status: "event_closed" };
        }

        // 2. User must exist and be a student
        const [users] = await connection.query(
        "SELECT schoolid FROM tbl_user WHERE schoolid = ? AND role = 'student'",
        [schoolId]
        );
        if (!users.length) {
        await connection.rollback();
        return { status: "user_not_found" };
        }

        // 3. Lock this event's participant row while we edit it
        const [rows] = await connection.query(
        "SELECT id, event_participants FROM tbl_event_participants WHERE event_id = ? FOR UPDATE",
        [eventId]
        );

        const participants = rows.length ? parseJSON(rows[0].event_participants) || [] : [];

        // 4. Don't add the same user twice
        if (participants.some((p) => p.userID === schoolId)) {
        await connection.rollback();
        return { status: "already_registered" };
        }

        participants.push({
        userID: schoolId,
        attendance: "pending",
        timeIn: null,
        timeOut: null,
        });

        // 5. Save (the row may not exist for events created before auto-participation)
        if (rows.length) {
        await connection.query(
            "UPDATE tbl_event_participants SET event_participants = ? WHERE event_id = ?",
            [JSON.stringify(participants), eventId]
        );
        } else {
        await connection.query(
            "INSERT INTO tbl_event_participants (event_id, event_participants) VALUES (?, ?)",
            [eventId, JSON.stringify(participants)]
        );
        }

        await connection.commit();
        return { status: "registered" };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
    },

                                              // Array of User Ids
    addClusteredParticipants: async (eventId, clusteredParticipants) => {
        try {
            const values = clusteredParticipants.map(participant => [eventId, participant.participant_id]);
            const [result] = await db.query(
                "INSERT INTO tbl_event_participants (event_id, participant_id) VALUES ?",
                [values]
            );
            return result;
        } catch (error) {
            throw error;
        }
    }
};

export default model;