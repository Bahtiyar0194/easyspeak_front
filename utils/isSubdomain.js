export const isSubdomain = () => {
    const origin = window.location.origin;
    const url = new URL(origin);
    const host = url.hostname.replace(/^www\./, '');
    const parts = host.split('.');

    if ((parts.length === 1 && parts[0] === 'localhost') || (parts.length === 2 && parts[1] !== 'localhost')) {
        return false;
    } else {
        return true;
    }
}