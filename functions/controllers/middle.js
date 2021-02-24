function possibleField(fields) {
    return (req, res, next) => {
        const fails = [];
        for (const field of fields) {
            if (!req.body[field]) {
                fails.push(field);
            }
        }
        if (fails.length == 1) {
            res.status(400).send(`${fails.join(',')} is required`);
        } else if (fails.length > 1) {
            res.status(400).send(`${fails.join(',')} are required`);
        } else {
            next();
        }
    };
}

function impossibleField(fields) {
    return (req, res, next) => {
        const fails = [];
        for (const field of fields) {
            if (req.body[field]) {
                fails.push(field);
            }
        }
        if (fails.length == 1) {
            res.status(400).send(`${fails.join(',')} cannot be changed`);
        } else if (fails.length > 1) {
            res.status(400).send(`${fails.join(',')} cannot be changed`);
        } else {
            next();
        }
    };
}

module.exports.possibleField = possibleField;
module.exports.impossibleField = impossibleField;