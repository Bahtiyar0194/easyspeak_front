export default defineNuxtPlugin(() => {
    const contacts = {
        url: 'easyspeak.kz',
        name: 'EasySpeak', // Не удалять
        site_name: 'EasySpeak.kz',
        email: 'info@easyspeak.kz',
        phone: '+77027992279',
        phone_format: '+7 (702) 799 2279',
        bin: '250640004519',
        legal_name: {
            ru: 'ТОО "EasySpeak"',
            kk: '"EasySpeak" ЖШС'
        },
        legal_address: {
            ru: 'Западно-Казахстанская область, г. Уральск, ул. Победы, д. 11',
            kk: 'Батыс Қазақстан облысы, Орал қ, Победа көш, 11 үй'
        },
        fact_address: {
            ru: 'Западно-Казахстанская область, г. Уральск, ул. М. Ихсанова 38',
            kk: 'Батыс Қазақстан облысы, Орал қ, М. Ықсанов көш 38'
        },

        bank: {
            name: {
                ru: 'АО "ForteBank"',
                kk: 'АҚ "ForteBank"'
            },
            bik: 'IRTYKZKA',
            iik: 'KZ8096512F0008376088'
        },
        founder: 'Кажмухамбетов Айбек Сатыполдиевич'
    }

    return {
        provide: {
            contacts
        }
    }
})
