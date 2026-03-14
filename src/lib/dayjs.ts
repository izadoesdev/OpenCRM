import _dayjs from "dayjs";
import isToday from "dayjs/plugin/isToday";
import isTomorrow from "dayjs/plugin/isTomorrow";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

_dayjs.extend(utc);
_dayjs.extend(timezone);
_dayjs.extend(relativeTime);
_dayjs.extend(isToday);
_dayjs.extend(isTomorrow);

const guessed = _dayjs.tz.guess();
_dayjs.tz.setDefault(guessed);

const dayjs = _dayjs;
export default dayjs;
export const userTimezone = guessed;
