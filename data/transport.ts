export interface Station {
    id: string
    name: string
    type: 'MRT' | 'LRT' | 'Monorail'
    line: 'kajang' | 'putrajaya' | 'kelana_jaya' | 'ampang' | 'sri_petaling' | 'monorail'
    latitude: number
    longitude: number
}

// Helper to get color by line
export const getLineColor = (line: Station['line']) => {
    switch (line) {
        case 'kajang': return '#00782f' // MRT Kajang Green
        case 'putrajaya': return '#ffc107' // MRT Putrajaya Yellow/Gold
        case 'kelana_jaya': return '#e0004d' // LRT KJ Pink/Red
        case 'ampang': return '#df8600' // LRT Ampang Orange
        case 'sri_petaling': return '#6d201b' // LRT SP Brown
        case 'monorail': return '#78be20' // Monorail Green
        default: return '#333333'
    }
}

export const transportStations: Station[] = [
    // MRT Kajang Line (SBK) - Ordered
    { id: 'sbk_kwasa_damansara', name: 'MRT Kwasa Damansara', type: 'MRT', line: 'kajang', latitude: 3.176383, longitude: 101.572350 },
    { id: 'sbk_surian', name: 'MRT Surian', type: 'MRT', line: 'kajang', latitude: 3.149230, longitude: 101.593800 },
    { id: 'sbk_mutiara_damansara', name: 'MRT Mutiara Damansara', type: 'MRT', line: 'kajang', latitude: 3.155350, longitude: 101.609600 },
    { id: 'sbk_bandar_utama', name: 'MRT Bandar Utama', type: 'MRT', line: 'kajang', latitude: 3.144883, longitude: 101.617300 },
    { id: 'sbk_ttdi', name: 'MRT TTDI', type: 'MRT', line: 'kajang', latitude: 3.136050, longitude: 101.630600 },
    { id: 'sbk_phileo_damansara', name: 'MRT Phileo Damansara', type: 'MRT', line: 'kajang', latitude: 3.129650, longitude: 101.642050 },
    { id: 'sbk_pusat_bandar_damansara', name: 'MRT Pusat Bandar Damansara', type: 'MRT', line: 'kajang', latitude: 3.143283, longitude: 101.662100 },
    { id: 'sbk_semantan', name: 'MRT Semantan', type: 'MRT', line: 'kajang', latitude: 3.151117, longitude: 101.665300 },
    { id: 'sbk_muzium_negara', name: 'MRT Muzium Negara', type: 'MRT', line: 'kajang', latitude: 3.137400, longitude: 101.687200 },
    { id: 'sbk_pasar_seni', name: 'MRT Pasar Seni', type: 'MRT', line: 'kajang', latitude: 3.142383, longitude: 101.696317 },
    { id: 'sbk_merdeka', name: 'MRT Merdeka', type: 'MRT', line: 'kajang', latitude: 3.141500, longitude: 101.701800 },
    { id: 'sbk_bukit_bintang', name: 'MRT Bukit Bintang', type: 'MRT', line: 'kajang', latitude: 3.146633, longitude: 101.711300 },
    { id: 'sbk_trx', name: 'MRT Tun Razak Exchange (TRX)', type: 'MRT', line: 'kajang', latitude: 3.142417, longitude: 101.720500 },
    { id: 'sbk_cochrane', name: 'MRT Cochrane', type: 'MRT', line: 'kajang', latitude: 3.132830, longitude: 101.723100 },
    { id: 'sbk_maluri', name: 'MRT Maluri', type: 'MRT', line: 'kajang', latitude: 3.123567, longitude: 101.726883 },
    { id: 'sbk_taman_midah', name: 'MRT Taman Midah', type: 'MRT', line: 'kajang', latitude: 3.095450, longitude: 101.730700 },

    // MRT Putrajaya Line (PY)
    { id: 'py_kwasa_damansara', name: 'MRT Kwasa Damansara', type: 'MRT', line: 'putrajaya', latitude: 3.176383, longitude: 101.572350 }, // Interchange
    { id: 'py_kepong_baru', name: 'MRT Kepong Baru', type: 'MRT', line: 'putrajaya', latitude: 3.209800, longitude: 101.645600 },
    { id: 'py_sentul_barat', name: 'MRT Sentul Barat', type: 'MRT', line: 'putrajaya', latitude: 3.181200, longitude: 101.683300 },
    { id: 'py_titiwangsa', name: 'MRT Titiwangsa', type: 'MRT', line: 'putrajaya', latitude: 3.173800, longitude: 101.696100 },
    { id: 'py_ampang_park', name: 'MRT Ampang Park', type: 'MRT', line: 'putrajaya', latitude: 3.159600, longitude: 101.719600 },
    { id: 'py_persiaran_klcc', name: 'MRT Persiaran KLCC', type: 'MRT', line: 'putrajaya', latitude: 3.155400, longitude: 101.715400 },
    { id: 'py_conlay', name: 'MRT Conlay', type: 'MRT', line: 'putrajaya', latitude: 3.150400, longitude: 101.718300 },
    { id: 'py_trx', name: 'MRT Tun Razak Exchange (TRX)', type: 'MRT', line: 'putrajaya', latitude: 3.142417, longitude: 101.720500 }, // Interchange

    // LRT Kelana Jaya Line
    { id: 'kj_kelana_jaya', name: 'LRT Kelana Jaya', type: 'LRT', line: 'kelana_jaya', latitude: 3.112467, longitude: 101.604600 },
    { id: 'kj_taman_bahagia', name: 'LRT Taman Bahagia', type: 'LRT', line: 'kelana_jaya', latitude: 3.111167, longitude: 101.612067 },
    { id: 'kj_taman_paramount', name: 'LRT Taman Paramount', type: 'LRT', line: 'kelana_jaya', latitude: 3.106467, longitude: 101.623400 },
    { id: 'kj_asia_jaya', name: 'LRT Asia Jaya', type: 'LRT', line: 'kelana_jaya', latitude: 3.104400, longitude: 101.637800 },
    { id: 'kj_taman_jaya', name: 'LRT Taman Jaya', type: 'LRT', line: 'kelana_jaya', latitude: 3.103983, longitude: 101.645517 },
    { id: 'kj_universiti', name: 'LRT Universiti', type: 'LRT', line: 'kelana_jaya', latitude: 3.114750, longitude: 101.661300 },
    { id: 'kj_kerinchi', name: 'LRT Kerinchi', type: 'LRT', line: 'kelana_jaya', latitude: 3.115450, longitude: 101.668733 },
    { id: 'kj_abdullah_hukum', name: 'LRT Abdullah Hukum', type: 'LRT', line: 'kelana_jaya', latitude: 3.118733, longitude: 101.673800 },
    { id: 'kj_bangsar', name: 'LRT Bangsar', type: 'LRT', line: 'kelana_jaya', latitude: 3.127883, longitude: 101.678783 },
    { id: 'kj_kl_sentral', name: 'LRT KL Sentral', type: 'LRT', line: 'kelana_jaya', latitude: 3.134500, longitude: 101.686567 },
    { id: 'kj_pasar_seni', name: 'LRT Pasar Seni', type: 'LRT', line: 'kelana_jaya', latitude: 3.142383, longitude: 101.696317 },
    { id: 'kj_masjid_jamek', name: 'LRT Masjid Jamek', type: 'LRT', line: 'kelana_jaya', latitude: 3.149500, longitude: 101.696500 },
    { id: 'kj_dang_wangi', name: 'LRT Dang Wangi', type: 'LRT', line: 'kelana_jaya', latitude: 3.156867, longitude: 101.701967 },
    { id: 'kj_kampung_baru', name: 'LRT Kampung Baru', type: 'LRT', line: 'kelana_jaya', latitude: 3.161067, longitude: 101.707167 },
    { id: 'kj_klcc', name: 'LRT KLCC', type: 'LRT', line: 'kelana_jaya', latitude: 3.159150, longitude: 101.712683 },
    { id: 'kj_ampang_park', name: 'LRT Ampang Park', type: 'LRT', line: 'kelana_jaya', latitude: 3.159600, longitude: 101.719600 },
    { id: 'kj_setiawangsa', name: 'LRT Setiawangsa', type: 'LRT', line: 'kelana_jaya', latitude: 3.175500, longitude: 101.735500 },
    { id: 'kj_wangsa_maju', name: 'LRT Wangsa Maju', type: 'LRT', line: 'kelana_jaya', latitude: 3.205200, longitude: 101.732300 },

    // LRT Ampang/Sri Petaling Line
    { id: 'amp_hang_tuah', name: 'LRT Hang Tuah', type: 'LRT', line: 'ampang', latitude: 3.139600, longitude: 101.706100 },
    { id: 'amp_plaza_rakyat', name: 'LRT Plaza Rakyat', type: 'LRT', line: 'ampang', latitude: 3.144400, longitude: 101.701100 },
    { id: 'amp_bandaraya', name: 'LRT Bandaraya', type: 'LRT', line: 'ampang', latitude: 3.153900, longitude: 101.694600 },
    { id: 'amp_sultan_ismail', name: 'LRT Sultan Ismail', type: 'LRT', line: 'ampang', latitude: 3.161800, longitude: 101.693800 },
    { id: 'amp_pwtc', name: 'LRT PWTC', type: 'LRT', line: 'ampang', latitude: 3.166600, longitude: 101.693200 },
    { id: 'amp_titiwangsa', name: 'LRT Titiwangsa', type: 'LRT', line: 'ampang', latitude: 3.173800, longitude: 101.696100 },
    { id: 'amp_chan_sow_lin', name: 'LRT Chan Sow Lin', type: 'LRT', line: 'ampang', latitude: 3.126500, longitude: 101.713600 },
    { id: 'amp_pudu', name: 'LRT Pudu', type: 'LRT', line: 'ampang', latitude: 3.134700, longitude: 101.711500 },

    // Monorail
    { id: 'mr_kl_sentral', name: 'Monorail KL Sentral', type: 'Monorail', line: 'monorail', latitude: 3.133200, longitude: 101.687200 },
    { id: 'mr_bukit_bintang', name: 'Monorail Bukit Bintang', type: 'Monorail', line: 'monorail', latitude: 3.146633, longitude: 101.711300 },
    { id: 'mr_chow_kit', name: 'Monorail Chow Kit', type: 'Monorail', line: 'monorail', latitude: 3.164800, longitude: 101.699000 },
]
