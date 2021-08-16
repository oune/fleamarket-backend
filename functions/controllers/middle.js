// 가능한 필드 명시
function requireField(fields) {
    // eslint-disable-next-line consistent-return
    return (req, res, next) => {
        const fails = [];
        for (const field of fields) {
            if (!req.body[field]) {
                fails.push(field);
            }
        }

        if (fails.length >= 1) {
            const be = (fails.length === 1) ? "is" : "are";
            return res.status(400).send(`${fails.join(',')} ${be} required`);
        }

        next();
    };
}

// 불가능한 필드 명시
function impossibleField(fields) {
    // eslint-disable-next-line consistent-return
    return (req, res, next) => {
        const fails = [];
        for (const field of fields) {
            if (req.body[field]) {
                fails.push(field);
            }
        }

        if (fails.length >= 1) {
            const be = (fails.length === 1) ? "is" : "are";
            return res.status(400).send(`${fails.join(',')} ${be} impossible`);
        }
        next();

    };
}

module.exports.requireField = requireField;
module.exports.impossibleField = impossibleField;