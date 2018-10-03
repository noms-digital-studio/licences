exports.seed = knex =>
    knex('staff_ids').delete()
        .then(
            () => knex('staff_ids').insert([
                {
                    nomis_id: "RO_USER_TEST",
                    staff_id: "DELIUS_ID_TEST",
                    first_name: 'FIRSTA',
                    last_name: 'LASTA'
                },
                {
                    nomis_id: "RO_USER_MULTI",
                    staff_id: "DELIUS_ID_TEST_MULTI",
                    first_name: 'FIRSTA',
                    last_name: 'LASTA'
                },
                {
                    nomis_id: "RO_USER",
                    staff_id: "DELIUS_ID",
                    first_name: 'JESSY',
                    last_name: 'SMITH',
                    organisation: 'Organisation 1',
                    job_role: 'Role 1',
                    email: 'email@1',
                    telephone: '1111'
                },
                {
                    nomis_id: "RO_USER2",
                    staff_id: "DELIUS_USER2",
                    first_name: 'SHEILA',
                    last_name: 'HANCOCK',
                    organisation: 'Organisation 2',
                    job_role: 'Role 2',
                    email: 'email@2',
                    telephone: '2222'
                },
                {
                    nomis_id: "RO_USER3",
                    staff_id: "DELIUS_USER3",
                    first_name: 'TREVOR',
                    last_name: 'SMITH',
                    organisation: 'Organisation 3',
                    job_role: 'Role 3',
                    email: 'email@3',
                    telephone: '3333'
                },
                {
                    nomis_id: "RO_USER4",
                    staff_id: "DELIUS_USER4",
                    first_name: 'DAVID',
                    last_name: 'BALL',
                    organisation: 'Organisation 4',
                    job_role: 'Role 4',
                    email: 'email@4',
                    telephone: '4444'
                },
                {
                    nomis_id: "RO_USER5",
                    staff_id: "DELIUS_USER5",
                    first_name: 'JULIE',
                    last_name: 'WOOD',
                    organisation: 'Organisation 5',
                    job_role: 'Role 5',
                    email: 'email@5',
                    telephone: '5555'
                },
                {
                    nomis_id: "RO_USER6",
                    staff_id: "DELIUS_USER6",
                    first_name: 'LYDIA',
                    last_name: 'HUME',
                    organisation: 'Organisation 6',
                    job_role: 'Role 6',
                    email: 'email@6',
                    telephone: '6666'
                }
                ,
                {
                    nomis_id: "RO_DEMO",
                    staff_id: "DELIUS_ID_DEMO",
                    first_name: 'Ryan',
                    last_name: 'Orton',
                    organisation: 'NPS Darlington',
                    job_role: 'Responsible Officer',
                    email: 'email@7',
                    telephone: '6666'
                }
            ])
        );

