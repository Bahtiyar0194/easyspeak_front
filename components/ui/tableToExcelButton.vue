<template>
    <button @click="exportToXLSX()" class="btn btn-outline-success" :class="props.className">
        <i class="bi bi-file-earmark-excel"></i>
        <span>{{ $t("export_to_xlsx") }}</span>
    </button>
</template>
<script setup>
import * as XLSX from 'xlsx';

const props = defineProps({
    table: {
        type: HTMLElement,
        required: false
    },
    fileName: {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: true
    }
});

const exportToXLSX = () => {
        const table = props.table;
        const tableData = [];

        // Extract table data
        table.querySelectorAll('tr').forEach(row => {
            const rowData = [];
            row.querySelectorAll('th, td').forEach(cell => {
                rowData.push(cell.textContent);
            });
            tableData.push(rowData);
        });

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(tableData);

        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Лист 1');

        // Export the workbook to Excel file
        XLSX.writeFile(workbook, props.fileName + '.xlsx');
}
</script>