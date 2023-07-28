FROM grafana/k6:latest

WORKDIR /base-apm-k6-qa
COPY . /base-apm-k6-qa

USER root
RUN apk update
RUN apk upgrade
RUN apk add --no-cache tzdata
ENV TZ=America/Sao_Paulo
RUN apk add go

ENV K6_OUT=influxdb=http://influxdb:8086/k6
ENV PATH=$PATH:/usr/local/go/bin
ENV GOPATH=$HOME/go
ENV GOBIN=$GOPATH/bin
ENV PATH=$PATH:$GOBIN

RUN chmod 777 -R /base-apm-k6-qa

RUN mkdir -p /home/usr/local
RUN go install go.k6.io/xk6/cmd/xk6@latest
RUN xk6 build --with github.com/NAlexandrov/xk6-tcp

ENTRYPOINT [ "/bin/sh" ]