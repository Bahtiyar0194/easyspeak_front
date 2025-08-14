export const useSchoolStore = defineStore('school', {
    state: () => ({
        schoolData: null
    }),

    actions: {
        setDefaultIcons() {
            const defaultIcons = [
                { size: 36, rel: "android-touch-icon", icon_name: "android-icon" },
                { size: 48, rel: "android-touch-icon", icon_name: "android-icon" },
                { size: 72, rel: "android-touch-icon", icon_name: "android-icon" },
                { size: 96, rel: "android-touch-icon", icon_name: "android-icon" },
                { size: 144, rel: "android-touch-icon", icon_name: "android-icon" },
                { size: 192, rel: "android-touch-icon", icon_name: "android-icon" },
                { size: 57, rel: "apple-touch-icon", icon_name: "apple-icon" },
                { size: 60, rel: "apple-touch-icon", icon_name: "apple-icon" },
                { size: 72, rel: "apple-touch-icon", icon_name: "apple-icon" },
                { size: 114, rel: "apple-touch-icon", icon_name: "apple-icon" },
                { size: 120, rel: "apple-touch-icon", icon_name: "apple-icon" },
                { size: 144, rel: "apple-touch-icon", icon_name: "apple-icon" },
                { size: 152, rel: "apple-touch-icon", icon_name: "apple-icon" },
                { size: 180, rel: "apple-touch-icon", icon_name: "apple-icon" },
                { size: 16, rel: "icon", icon_name: "favicon" },
                { size: 32, rel: "icon", icon_name: "favicon" },
                { size: 96, rel: "icon", icon_name: "favicon" }
            ];

            for (let icon of defaultIcons) {
                const link = document.createElement('link');
                link.rel = icon.rel;
                link.sizes = `${icon.size}x${icon.size}`;
                link.type = "image/png";
                link.href = `/${icon.icon_name}-${icon.size}x${icon.size}.png`;
                document.head.appendChild(link);
            }
        },

        async getSchool() {
            const { $axiosPlugin } = useNuxtApp();
            const config = useRuntimeConfig();

            try {
                const response = await $axiosPlugin.post('school/get', {
                    subdomain: localStorage.getItem('subdomain')
                });

                if (response.data.school_id) {
                    const school = response.data;
                    this.schoolData = school;

                    document.body.classList.add(
                        school.title_font_class,
                        school.body_font_class,
                        school.color_scheme_class
                    );

                    const dynamicManifest = {
                        name: school.school_name,
                        short_name: school.school_name,
                        description: school.school_name,
                        start_url: `${window.location.protocol}//${window.location.host}`,
                        scope: `${window.location.protocol}//${window.location.host}`,
                        display: "standalone",
                        orientation: "portrait",
                        background_color: "#ffffff",
                        theme_color: "#ffffff",
                        icons: school.manifest_icons
                    };

                    const manifestLink = document.createElement('link');
                    manifestLink.rel = 'manifest';
                    const stringManifest = JSON.stringify(dynamicManifest);
                    const blob = new Blob([stringManifest], { type: 'application/json' });
                    manifestLink.href = URL.createObjectURL(blob);
                    document.head.appendChild(manifestLink);

                    if (school.favicons?.length > 0) {
                        for (let fav of school.favicons) {
                            const link = document.createElement('link');
                            link.rel = fav.rel;
                            link.sizes = `${fav.size}x${fav.size}`;
                            link.type = "image/png";
                            if (school.favicon) {
                                link.href = `${config.public.apiBase}/school/get_favicon/${school.school_id}/${fav.icon_name}-${fav.size}x${fav.size}.png`;
                            } else {
                                link.href = `/${fav.icon_name}-${fav.size}x${fav.size}.png`;
                            }
                            document.head.appendChild(link);
                        }
                    } else {
                        this.setDefaultIcons();
                    }

                } else {
                    this.schoolData = null;
                    this.setDefaultIcons();
                }

            } catch (err) {
                if (err.response) {
                    navigateTo({
                        path: '/error',
                        query: { status: err.response.status }
                    });
                } else {
                    navigateTo('/error');
                }
            }
        },

        async resetSchool() {
            localStorage.removeItem('subdomain');
            this.schoolData = null;
            await this.getSchool();
        }
    }
});
