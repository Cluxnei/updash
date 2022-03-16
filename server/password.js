const bcrypt = require('bcrypt');

async function compare(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
}

async function hash(plainPassword, saltRounds = 10) {
    return bcrypt.hash(plainPassword, saltRounds);
}

module.exports = {
    compare,
    hash,
};
