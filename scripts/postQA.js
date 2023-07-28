import http from "k6/http";
import { sleep, check } from "k6";
import { Faker } from "k6/x/faker";
import { Counter, Trend , Rate} from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export let errorRate = new Rate("errors");
const myTrend = new Trend("my_trend");

export function handleSummary(data) {
  return {
    "./reports/html/result.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

export const options = {
  // Key configurations for test in this section
  stages: [
    { duration: '3s', target: 5 }, // traffic ramp-up from 1 to 5 users over 5 seconds.
    { duration: '5s', target: 5 }, // stay at 5 users for 1 minute
    { duration: '2s', target: 0 }, // ramp-down to 0 users
  ],
};

export default function () {
  let f = new Faker();
  const url = "http://10.213.83.37:8001/create-qa";
  const payload = JSON.stringify({
    name: f.name(),
    years: 20,
  });
  const params = {
    headers: {
      "Content-Type": "application/json",
      "Authorization": "1234"
    },
  };
  const res = http.post(url, payload, params);
  console.log(res.body);
  let checkRes = check(res, {
    "is status 201": (res) => res.status === 201,
  });

  if (!checkRes) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  myTrend.add(res.timings.connecting, {
    uri: res.request.url,
    method: res.request.method,
    status: res.status,
    response: JSON.stringify(res.body),
  });
}
