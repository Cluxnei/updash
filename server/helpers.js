
const CONSOLE_COLORS = {
    'Reset': "\x1b[0m",
    'Bright': "\x1b[1m",
    'Dim': "\x1b[2m",
    'Underscore': "\x1b[4m",
    'Blink': "\x1b[5m",
    'Reverse': "\x1b[7m",
    'Hidden': "\x1b[8m",
    'FgBlack': "\x1b[30m",
    'FgRed': "\x1b[31m",
    'FgGreen': "\x1b[32m",
    'FgYellow': "\x1b[33m",
    'FgBlue': "\x1b[34m",
    'FgMagenta': "\x1b[35m",
    'FgCyan': "\x1b[36m",
    'FgWhite': "\x1b[37m",
    'BgBlack': "\x1b[40m",
    'BgRed': "\x1b[41m",
    'BgGreen': "\x1b[42m",
    'BgYellow': "\x1b[43m",
    'BgBlue': "\x1b[44m",
    'BgMagenta': "\x1b[45m",
    'BgCyan': "\x1b[46m",
    'BgWhite': "\x1b[47m",
};

function randomColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
}

function randomName() {
    return `${Math.floor(Math.random() * 100).toString(16)}`;
}

function log(entity, message, ...messages) {
    console.log(`${CONSOLE_COLORS.FgMagenta}${new Date().toISOString()}:${CONSOLE_COLORS.FgYellow}[${entity.id}]${CONSOLE_COLORS.Reset} -`, message, ...messages);
};

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function currentTimestamp() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
}

function isToday(someDate) {
    const today = new Date()
    return someDate.getDate() === today.getDate() &&
      someDate.getMonth() === today.getMonth() &&
      someDate.getFullYear() === today.getFullYear()
  }

module.exports = {
    CONSOLE_COLORS,
    log,
    randomColor,
    delay,
    currentTimestamp,
    isToday,
    randomName,
};