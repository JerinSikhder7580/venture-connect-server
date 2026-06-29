const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = "mongodb+srv://ventureconnect:FznRevypdNiryQEm@cluster0.gqu9vmb.mongodb.net/?appName=Cluster0";

const founderNames = [
    "Aarav Rahman",
    "Nusrat Karim",
    "Rafi Chowdhury",
    "Maya Islam",
    "Tanvir Hasan",
    "Sadia Akter",
    "Zara Ahmed",
    "Imran Hossain",
    "Farhan Kabir",
    "Anika Sultana",
    "Mehedi Rahman",
    "Tanjina Noor",
    "Rayan Siddique",
    "Samira Khan",
    "Nabil Ahmed",
];

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

function getRandomFounderName() {
    const randomIndex = Math.floor(Math.random() * founderNames.length);
    return founderNames[randomIndex];
}

async function run() {
    try {
        await client.connect();

        const database = client.db("ventureconnect_db");
        const startupsCollection = database.collection("startups");
        const startups = await startupsCollection.find({}, { projection: { _id: 1 } }).toArray();

        if (!startups.length) {
            console.log("No startups found.");
            return;
        }

        const operations = startups.map((startup) => ({
            updateOne: {
                filter: { _id: startup._id },
                update: {
                    $set: {
                        founderName: getRandomFounderName(),
                    },
                },
            },
        }));

        const result = await startupsCollection.bulkWrite(operations);
        console.log(`Updated ${result.modifiedCount} startups with random founder names.`);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
