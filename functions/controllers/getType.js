function getStockCountName(state) {
    switch (stock.state) {
        case "A":
        case "a":
            return "stockCountA"
        case "B":
        case "b":
            return "stockCountB"
        case "C":
        case "c":
            return "stockCountC"
        default:
            return ""
    }
}

function getReservationCountName(state) {
    switch (stock.state) {
        case "A":
        case "a":
            return "reservationCountA"
        case "B":
        case "b":
            return "reservationCountB"
        case "C":
        case "c":
            return "reservationCountC"
        default:
            return ""
    }
}

module.exports.getStockCountName = getStockCountName;
module.exports.getReservationCountName = getReservationCountName;