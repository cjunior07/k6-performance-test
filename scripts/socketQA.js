import tcp from 'k6/x/tcp';
import { check } from 'k6';
import { Rate } from "k6/metrics";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

export let errorRate = new Rate("errors");

export function handleSummary(data) {
  return {
    "./reports/html/result.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

export const options = {
  discardResponseBodies: false,
  scenarios: {
    socket: {
      executor: "per-vu-iterations",
      vus: 1,
      iterations: 1,
    },
  },
};

export default function () {
  var host = "";
  var port = "";
  var message = "";

  const conn = tcp.connect(host + ':' + port);
  tcp.write(conn, message);
  let res = String.fromCharCode(...tcp.read(conn, 1024))

  let checkRes = check(res, {
    // 'check response': (res) => res.includes('')
  });
  if (!checkRes) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  tcp.close(conn);
}