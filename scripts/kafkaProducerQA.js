import { check } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

import {
    Writer,
    Connection,
    SchemaRegistry,
    SCHEMA_TYPE_JSON,
    SASL_SCRAM_SHA512,
    TLS_1_2,
} from "k6/x/kafka";

export const options = {
    scenarios: {
        producerKakfa: {
            executor: 'per-vu-iterations',
            vus: 1,
            iterations: 1,
        },
    },
};

export function handleSummary(data) {
    return {
        "./reports/html/result.html": htmlReport(data),
        stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}

const brokers = ['', '', ''];
const topic = "";

const saslConfig = {
    username: "",
    password: "",
    algorithm: SASL_SCRAM_SHA512,
};

const tlsConfig = {
    enableTls: true,
    insecureSkipTlsVerify: false,
    minVersion: TLS_1_2,
};

const offset = 0;
const partition = 0;
const numPartitions = 1;
const replicationFactor = 1;

const writer = new Writer({
    brokers: brokers,
    topic: topic,
    sasl: saslConfig,
    tls: tlsConfig,
    authenticationTimeout: 5000
});

const connection = new Connection({
    address: brokers[0],
    sasl: saslConfig,
    tls: tlsConfig,
    authenticationTimeout: 5000,
    reauthenticationThreshold: 10000,
    ssl: true
});

const schemaRegistry = new SchemaRegistry();

export default function () {
    let messages = [
        {
            key: schemaRegistry.serialize({
                data: {
                    correlationId: "k6-dock-kafka-test",
                },
                schemaType: SCHEMA_TYPE_JSON,
            }),
            value: schemaRegistry.serialize({
                data: {},
                schemaType: SCHEMA_TYPE_JSON,
            }),
        },
    ];

    const sendedMessages = writer.produce({ messages: messages }, { acks: 1, authWaitTimeout: 5000 });
}

export function teardown(data) {
    writer.close();
    connection.close();
}
