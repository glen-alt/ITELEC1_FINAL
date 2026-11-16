import express from 'express';
import controller from '../controllers/controller.js';
const router = express.Router();

router.post('/register', controller.registerUser);
router.post('/login', controller.loginUser);
router.get("/users/search", controller.searchUsers);
router.get('/users', controller.getAllUsers);


router.post("/events", controller.createEvent);
router.get("/events", controller.getAllEvents);
router.get('/events/search', controller.searchForEvent);
router.post("/events/register", controller.registerForEvent);

router.get('/event/participants', controller.getAllParticipants);
router.get("/events/participatedIn", controller.getParticipatedEvents);
router.put('/event/time-in-out', controller.participantsTimeInOutHandler);
router.put('/event/removeParticipants', controller.removeParticipants);
router.get("/events/:id", controller.getEventById); // after the specific routes
export default router;