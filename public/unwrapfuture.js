onmessage = (message) => {
    let expression = message.data;
    let array = [];
    while (true) {
        try {
            array.push(expression.next().value)
        } catch {
            postMessage(array);
            break;
        }
    }
}
