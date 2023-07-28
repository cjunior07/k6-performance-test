import http from 'k6/http';
import { sleep, check } from 'k6';
import { Faker } from "k6/x/faker";
import { Counter, Trend } from 'k6/metrics';
import { Rate } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export let errorRate = new Rate("errors");
const myTrend = new Trend('my_trend');

export function handleSummary(data) {
    return {
        "./reports/html/result.html": htmlReport(data),
        stdout: textSummary(data, { indent: " ", enableColors: true }),
    };
}

export const options = {
    discardResponseBodies: false,
    scenarios: {
        patchQA: {
            executor: 'per-vu-iterations',
            vus: 5,
            iterations: 2,
        },
    },
};

export default function () {
    let f = new Faker();
    const url = "http://10.213.83.37:8001/create-qa";
    const payload = JSON.stringify({});
    const params = {
        headers: {
            'Content-Type': 'application/json',
        }
    };
    const res = http.patch(url, payload, params);
    console.log(res.body);
    let checkRes = check(res, {
        'is status 200': (res) => res.status === 200
    });

    if (!checkRes) {
        errorRate.add(1)
    } else {
        errorRate.add(0)
    }

    myTrend.add(res.timings.connecting, { uri: res.request.url, method: res.request.method, status: res.status, response: JSON.stringify(res.body) });
}