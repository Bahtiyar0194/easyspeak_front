export default defineNuxtPlugin(() => {
    const contacts = {
        url: 'easyspeak.kz',
        name: 'EasySpeak', // Не удалять
        site_name: 'EasySpeak.kz',
        email: 'info@easyspeak.kz',
        phone: '+77027992279',
        phone_format: '+7 (702) 799 2279',
        bin: '250640004519',
        postal_code: '090000',
        vat_percent: 12.00,

        founder: 'Кажмухамбетов Айбек Сатыполдиевич',
        founder_short: 'Кажмухамбетов А.С.',
                
        legal_name: {
            ru: 'ТОО "EasySpeak"',
            kk: '"EasySpeak" ЖШС'
        },

        legal_name_full: {
            ru: 'Товарищество с ограниченной ответственностью "EasySpeak"',
            kk: '"EasySpeak" жауапкершілігі шектеулі серіктестігі'
        },

        legal_address: {
            ru: 'Республика Казахстан, Западно-Казахстанская область, г. Уральск, ул. Победы, д. 11',
            kk: 'Қазақстан Республикасы, Батыс Қазақстан облысы, Орал қ, Победа көш, 11 үй',
            map_link: 'https://yandex.kz/maps/-/CLAbqGk-'
        },
        fact_address: {
            ru: 'Республика Казахстан, Западно-Казахстанская область, г. Уральск, ул. М. Ихсанова 38',
            kk: 'Қазақстан Республикасы, Батыс Қазақстан облысы, Орал қ, М. Ықсанов көш 38'
        },

        bank: {
            name: {
                ru: 'АО "ForteBank"',
                kk: '"ForteBank" АҚ'
            },
            bik: 'IRTYKZKA',
            iik: 'KZ8096512F0008376088',
            currency: {
                iso: 'KZT',
                symbol: '₸',
                name: {
                    ru: 'Тенге',
                    kk: 'Теңге'
                }
            }
        },
    }

    return {
        provide: {
            contacts
        }
    }
})
