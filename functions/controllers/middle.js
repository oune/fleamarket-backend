function requireField(fields) {
    return (req, res, next) => {
        const fails = [];
        for (const field of fields) {
            if (!req.body[field]) {
                fails.push(field);
            }
        }
        if (fails.length === 1) {
            return res.status(400).send(`${fails.join(',')} is required`);
        } else if (fails.length > 1) {
            return res.status(400).send(`${fails.join(',')} are required`);
        }
        next();
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
        if (fails.length === 1) {
            return res.status(400).send(`${fails.join(',')} is impossible`);
        } else if (fails.length > 1) {
            return res.status(400).send(`${fails.join(',')} are impossible`);
        }
        next();

    };
}

module.exports.requireField = requireField;
module.exports.impossibleField = impossibleField;