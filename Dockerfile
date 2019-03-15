FROM ubuntu:16.04

ENV appDir /var/www/app/current

RUN apt-get update && apt-get install -y -q --no-install-recommends \
    apt-utils apt-transport-https curl \
    python3 python3-pip python3-setuptools \
    imagemagick psmisc \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get -y autoclean

RUN curl -sL https://deb.nodesource.com/setup_9.x | bash -
RUN apt-get install -y -q --no-install-recommends nodejs

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update
RUN apt-get install -y -q --no-install-recommends yarn

RUN mkdir -p /output
RUN mkdir -p /input

RUN mkdir -p /var/www/app/current
WORKDIR ${appDir}

ADD . /var/www/app/current

RUN cd node_middleware && yarn install

RUN cd vue_frontend && yarn install

RUN pip3 install --upgrade pip
RUN cd node_middleware && pip3 install -r python-requirements.txt

ENV PATH="/var/www/app/current:${PATH}"

ENTRYPOINT ["/bin/bash"]

EXPOSE 3000 8080
