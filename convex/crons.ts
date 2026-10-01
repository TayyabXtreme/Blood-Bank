import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
const crons = cronJobs();
crons.interval('Expire overdue blood requests', { minutes: 5 }, internal.requests.expireAll, {});
export default crons;
