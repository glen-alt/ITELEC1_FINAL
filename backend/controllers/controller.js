import model from '../model/model.js';

const MONTHS = ["Jan.", "Feb.", "Mar.", "Apr.", "May", "Jun.", "Jul.", "Aug.", "Sep.", "Oct.", "Nov.", "Dec."];

// "2026-11-16" -> "Nov. 16, 2026" (same format your sorting expects)
const formatDate = (value) => {
  const [y, m, d] = String(value).split("-").map(Number);
  if (!y || !m || !d) return null;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

// "07:00" -> "7:00am", "13:30" -> "1:30pm"
const formatTime = (value) => {
  const [h, m] = String(value).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const suffix = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")}${suffix}`;
};

const controller = {
    registerUser: async (req, res) => {
        try {
            const userData = req.body;
            console.log('Received user data for registration:', userData);
            const newUser = await model.registerUser(userData);
            res.status(201).json({ message: 'User registered successfully', user: newUser });
        } catch (error) {
            console.error('Error registering user:', error);
            res.status(500).json({ message: 'Error registering user', error: error.message });
        }
    },

    loginUser: async (req, res) => {
        try {
            const loginData = req.body;
            const user = await model.loginUser(loginData);
            if (user) {
                res.status(200).json({ message: 'Login successful', user });
            } else {
                res.status(401).json({ message: 'Invalid username or password' });
            }
        } catch (error) {
            console.error('Error logging in user:', error);
            res.status(500).json({ message: 'Error logging in user', error: error.message });
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const users = await model.getAllUsers();
            res.status(200).json({ message: 'Users retrieved successfully', users });
        } catch (error) {
            console.error('Error retrieving users:', error);
            res.status(500).json({ message: 'Error retrieving users', error: error.message });
        }
    },

    searchForUser: async (req, res) => {
        try {
            const searchTerm = req.query.q;
            const users = await model.searchForUser(searchTerm);
            res.status(200).json({ message: 'Users retrieved successfully', users });
        } catch (error) {
            console.error('Error searching for users:', error);
            res.status(500).json({ message: 'Error searching for users', error: error.message });
        }
    },



    createEvent: async (req, res) => {
        try {
            const {
            creatorId, name, details, type, visibility,
            eventDate, registrationStart, registrationEnd,
            closingStart, closingEnd, location, comserve,
            years = [], sections = [], departments = [],
            } = req.body;
            console.log(req.body);
            if (!creatorId || !name?.trim() || !eventDate || !location?.trim()) {
            return res.status(400).json({ message: "Name, date, venue and creator are required" });
            }
            if (!["Open", "Closed"].includes(visibility)) {
            return res.status(400).json({ message: "Visibility must be Open or Closed" });
            }

            const date = formatDate(eventDate);
            const regStart = formatTime(registrationStart);
            const regEnd = formatTime(registrationEnd);
            const closeStart = formatTime(closingStart);
            const closeEnd = formatTime(closingEnd);

            if (!date || !regStart || !regEnd || !closeStart || !closeEnd) {
            return res.status(400).json({ message: "Invalid date or time" });
            }

            const schedule = {
            eventDate: date,
            registrationTime: `${regStart} - ${regEnd}`,
            closingTime: `${closeStart} - ${closeEnd}`,
            location: location.trim(),
            comserve: comserve ? `${comserve} hours` : "0 hours",
            };

            const requiredParameters = {
                year: years.map(Number).filter((n) => !Number.isNaN(n)),
                section: sections,
                department: departments,
            };

            const { eventId, participantCount } = await model.createEvent({
                creatorId,
                name: name.trim(),
                details: (details || "").trim(),
                schedule,
                requiredParameters,
                visibility,
                type,
            });

            res.status(201).json({
                message: "Event created successfully",
                id: eventId,
                participantCount,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
        },

    getAllEvents: async (req, res) => {
    try {
        const { q = "", category = "all", order = "asc" } = req.query;
        const events = await model.getAllEvents(q.trim(), category, order);
        res.json({ message: "Events retrieved successfully", events });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
    },

    searchForEvent: async (req, res) => {
        try {
            const searchTerm = req.query.q;
            const events = await model.searchForEvent(searchTerm);
            res.status(200).json({ message: 'Events retrieved successfully', events });
        } catch (error) {
            console.error('Error searching for events:', error);
            res.status(500).json({ message: 'Error searching for events', error: error.message });
        }
    },

    getEventById: async (req, res) => {
    try {
        const eventId = Number(req.params.id);

        if (!Number.isInteger(eventId)) {
        return res.status(400).json({ message: "Invalid event id" });
        }

        const event = await model.getEventById(eventId);

        if (!event) {
        return res.status(404).json({ message: "Event not found" });
        }

        res.json({ message: "Event retrieved successfully", event });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
    },


    getAllParticipants: async (req, res) => {
        try {
            const eventId = req.query.eventId;
            const participants = await model.getAllParticipants(eventId);
            res.status(200).json({ message: 'Participants retrieved successfully', participants });
        } catch (error) {
            console.error('Error retrieving participants:', error);
            res.status(500).json({ message: 'Error retrieving participants', error: error.message });
        }
    },

    getParticipatedEvents: async (req, res) => {
    try {
      const userId = req.query.userId; // keep as string, e.g. "s1"

      if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }

        const events = await model.searchEventsByUserID(userId);

        res.json({ message: "Events retrieved successfully", events });
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
        }
    },

    searchUsers: async (req, res) => {
        try {
        const { q = "", category = "all", order = "asc" } = req.query;

        const users = await model.searchUsers(q.trim(), category, order);

        res.json({ message: "Users retrieved successfully", users });
        } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
        }
    },

    participantsTimeInOutHandler: async (req, res) => {
        try {
            const { participantId, timeIn, timeOut } = req.body;
            const updatedParticipant = await model.participantsTimeInOutHandler(participantId, timeIn, timeOut);
            res.status(200).json({ message: 'Participant time updated successfully', participant: updatedParticipant });
        } catch (error) {
            console.error('Error updating participant time:', error);
            res.status(500).json({ message: 'Error updating participant time', error: error.message });
        }
    },

    removeParticipants: async (req, res) => {
        try {
            const { participantId } = req.body;
            const removedParticipant = await model.removeParticipants(participantId);
            res.status(200).json({ message: 'Participant removed successfully', participant: removedParticipant });
        } catch (error) {
            console.error('Error removing participant:', error);
            res.status(500).json({ message: 'Error removing participant', error: error.message });
        }
    },

    registerForEvent: async (req, res) => {
    try {
        const { eventId, schoolId } = req.body;

        if (!eventId || !schoolId) {
        return res.status(400).json({ message: "eventId and schoolId are required" });
        }

        const { status } = await model.registerParticipant(Number(eventId), String(schoolId));

        const responses = {
        registered:         [201, "Registered successfully"],
        already_registered: [409, "You are already registered for this event"],
        event_not_found:    [404, "Event not found"],
        event_closed:       [403, "This event is closed for registration"],
        user_not_found:     [404, "Student not found"],
        };

        const [code, message] = responses[status];
        res.status(code).json({ message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
    },

    addClusteredParticipants: async (req, res) => {
        try {
            const { eventId, participantIds } = req.body;
            const addedParticipants = await model.addClusteredParticipants(eventId, participantIds);
            res.status(200).json({ message: 'Clustered participants added successfully', participants: addedParticipants });
        } catch (error) {
            console.error('Error adding clustered participants:', error);
            res.status(500).json({ message: 'Error adding clustered participants', error: error.message });
        }
    }

};

export default controller;