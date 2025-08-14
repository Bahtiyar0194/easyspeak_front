export default defineNuxtPlugin(() => {
    const schoolStore = useSchoolStore();
    schoolStore.getSchool();
});