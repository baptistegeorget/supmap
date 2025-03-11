FROM ghcr.io/valhalla/valhalla:3.5.1
WORKDIR /data/valhalla
COPY valhalla.json *.osm.pbf ./
RUN valhalla_build_tiles -c valhalla.json *.osm.pbf
CMD valhalla_service valhalla.json 1