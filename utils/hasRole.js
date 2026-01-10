export const hasRole = (roles = []) => {
    const authUser = useSanctumUser();
        
    if (!authUser.value) return false;

    const userRoles = Array.isArray(authUser.value.current_role_id)
        ? authUser.value.current_role_id
        : [authUser.value.current_role_id];

    return roles.some(r => userRoles.includes(r));
}