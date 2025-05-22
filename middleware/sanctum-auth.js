// middleware/sanctum-auth.js
export default defineNuxtRouteMiddleware((to) => {
    const auth = useSanctumAuth();

    if (!auth.loggedIn.value) {
        return navigateTo(`/auth/login?redirect=${encodeURIComponent(to.fullPath)}`);
    }
});  