export interface bvnInterface {
    // _id: string,                                                                                                                                                 
    request_reference: string,
    bvn_number: string, // required and unique
    name_on_card: string,
    enrolment_branch: string | null,
    enrolment_bank: string | null,
    formatted_registration_date: null,
    level_of_account: string,
    nin: string | null,
    watchlisted: string | null,
    verification_status: string,
    service_type: string,
    personal_info: {
        first_name: string,
        middle_name: string,
        last_name: string,
        full_name: string,
        email: string,
        gender: string,
        phone_number: string,
        phone_number_2: null,
        date_of_birth: string,
        formatted_date_of_birth: string,
        lga_of_origin: string,
        state_of_origin: string,
        nationality: string,
        marital_status: string,
        image_url: string | null,
        image_base64: string | null,
    },
    residential_info: {
        state_of_residence: string,
        lga_of_residence: string,
        residential_address: string | null,
    },
}

export interface verificationInterface {
    _id?: string,
    user: {
        user_id?: string;
        firstName: string;
        lastName: string;
        middleName: string;
        dob: string;
        phoneNumber: string;
        email: string;
        gender: string;
        country: string;
        userPhoto: string; // image url
        userVideo: string; // video url. Accepted video format is mp4. File size limit is 10mb. duraction max 15 sec.
    },
    accountNumber: string;
    bvn_number: string;
    bvnData: bvnInterface;
    nin_number: string;
    ninData: any;

    idData: {
        idType: string;
        idNumber: string;
        idIssueDate: string;
        idExpiryDate: string;
        idCardFront: string; // image url
        idCardBack: string; // image url
    },
    address: {
        houseNumber: string;
        streetName: string;
        additional?: string;
        city: string;
        nearestLandmark: string;
        localGovernment: string;
        state: string;
        country: string;

        proofOfAddressVerification: string; // image url
    },
    nationality: {
        // countryOfNationality: string | undefined;
        placeOfBirth: string;
        countryOfBirth: string;
    },

    pep: string;
    customerSignature: string; // image url
    utilityBill: string; // image url

    createdAt?: Date;
    updatedAt?: Date;
}
