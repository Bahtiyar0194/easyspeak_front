export function formatToInvoiceNumber(num) {
    if (num) {
        return num.toString().padStart(8, '0')
    }
}