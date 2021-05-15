function getTodayDate() {
    const dob = new Date();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June', 'July',
        'August', 'September', 'October', 'November', 'December'
    ];

    const day = dob.getDate();
    const monthIndex = dob.getMonth();
    const year = dob.getFullYear();

    // return day + ' ' + monthNames[monthIndex] + ' ' + year;
    console.log(`${day} ${monthNames[monthIndex]} ${year}`)
    return `${day} ${monthNames[monthIndex]} ${year}`;
}

module.exports = getTodayDate