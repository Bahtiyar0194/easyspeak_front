const debounceHandler = (callback, delay = 500) => {
    let timeout;
    return function (...args) {
        const context = this; // Сохраняем контекст
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            callback.apply(context, args); // Вызываем функцию с контекстом и аргументами
        }, delay);
    };
};

export { debounceHandler };