import * as d3geo from 'd3-geo';
// @ts-ignore
import * as d3gcp from 'd3-composite-projections';
// @ts-ignore
import * as d3gp from 'd3-geo-projection';
import type { ConfigurationInterface, ConfigurationLimitsInterface } from './interfaces';

export type ProjectionOperationMethod = "center" | "scale" | "rotate" | "parallel" | "lobes" | "fraction" | "alpha" | "coefficient";

export interface ProjectionOperationParamInterface {
  config: string
  default: number
  type: string
}

export interface ProjectionOperationInterface {
  center?: ProjectionOperationParamInterface[]|null;
  rotate?: ProjectionOperationParamInterface[]|null;
  scale?: ProjectionOperationParamInterface[]|null;
  translate?: ProjectionOperationParamInterface[]|null;
  parallel?: ProjectionOperationParamInterface[]|null;
  lobes?: ProjectionOperationParamInterface[]|null;
  fraction?: ProjectionOperationParamInterface[]|null;
  alpha?: ProjectionOperationParamInterface[]|null;
  coefficient?: ProjectionOperationParamInterface[]|null;
}

export interface ProjectionDescriptorInterface {
  id: string
  lib: string
  ops?: ProjectionOperationInterface
}

export interface ParamTypeInterface {
  type: string
  min: number
  max: number
  step: number
}

export const paramTypes: ParamTypeInterface[] = [
  {
    type: "latitude",
    min: -90,
    max: 90,
    step: 1
  },
  {
    type: "longitude",
    min: -180,
    max: 180,
    step: 1,
  },
  {
    type: "scale",
    min: -3000,
    max: 3000,
    step: 1
  },
  {
    type: "translateX",
    min: -3000,
    max: 3000,
    step: 1
  },
  {
    type: "translateY",
    min: -3000,
    max: 3000,
    step: 1
  },
  {
    type: "viewWidth",
    min: 1,
    max: 1200,
    step: 1
  },
  {
    type: "viewHeight",
    min: 1,
    max: 1200,
    step: 1
  },

];

export const makeProjection = (config: ConfigurationInterface) => {
  const projectionEntity = projectionDescriptors.filter((item) => item.id === config.projection)[0];
  const projName = `geo${projectionEntity.id}`;
  const libName = projectionEntity.lib;
  const projectionLib = getProjectionLib(libName);
  if (typeof projectionLib[projName] !== "function") {
    throw Error(`projection not available: ${projName} in ${libName}`);
  }

  const operations = { ...standardOperations, ...projectionEntity?.ops };
  const projection = projectionLib[projName]();

  for (const [operation, params] of Object.entries(operations)) {
    // operation with explicit null as values should be omitted in the execution chain
    if (params === null) { continue; }

    // little bit typing...
    const def = params?.map((item) => {
      const value = config[item.config];
      return value ?? item.default;
    });

    projection[operation](def);
  }

  return projection;
};

const getProjectionLib = (libName: string) => {
  switch (libName) {
    case 'd3geo': return d3geo;
    case 'd3gp': return d3gp;
    case 'd3cp': return d3gcp;
    default: throw Error(`projection lib not available: ${libName}`);
  }
}

export const getFieldMeta = (type: string) => paramTypes.filter((item) => item.type === type);

const standardOperations: ProjectionOperationInterface = {
  center: [
    {
      config: "centerLon",
      default: 0,
      type: "longitude"
    },
    {
      config: "centerLat",
      default: 0,
      type: "latitude"
    }
  ],
  scale: [
    {
      config: "scale",
      default: 1,
      type: "scale"
    }
  ],
  rotate: [
    {
      config: "rotateLambda",
      default: 0,
      type: "longitude"
    },
    {
      config: "rotatePhi",
      default: 0,
      type: "longitude"
    },
    {
      config: "rotateGamma",
      default: 0,
      type: "longitude"
    },
  ],
  translate: [
    {
      config: "translateX",
      default: 1,
      type: "translateX"
    },
    {
      config: "translateY",
      default: 1,
      type: "translateY"
    }
  ],
}

// tbd.
export const projectionDescriptors: ProjectionDescriptorInterface[] = [
  {
    id: "AzimuthalEqualArea",
    lib: "d3geo",
  },
  {
    id: "CylindricalEqualArea",
    lib: "d3gp",
    ops: {
      parallel: [
        {
          config: "parallel",
          default: 38.58,
          type: "latitude",
        }
      ]
    }
  },
  {
      id: "AzimuthalEquidistant",
      lib: "d3geo"
    },
  {
      id: "Gnomonic",
      lib: "d3geo"
  },
  {
      id: "Orthographic",
      lib: "d3geo"
  },
  {
      id: "Stereographic",
      lib: "d3geo"
  },
  {
      id: "Albers",
      lib: "d3geo"
  },
  {
      id: "ConicConformal",
      lib: "d3geo"
  },
  {
      id: "ConicEqualArea",
      lib: "d3geo"
  },
  {
      id: "ConicEquidistant",
      lib: "d3geo"
  },
  {
      id: "Equirectangular",
      lib: "d3geo"
  },
  {
      id: "Mercator",
      lib: "d3geo"
  },
  {
      id: "TransverseMercator",
      lib: "d3geo"
  },
  // projections from d3 geo projections package...
  {
    id: "Baker",
    lib: "d3gp"
  },
  {
    id: "Airy",
    lib: "d3gp"
  },
  // a composite projection
  {
    id: "ConicConformalFrance",
    lib: "d3gcp"
  }
];

/*

      Aitoff
      Airy // .radius([radius]), defaults 90
      Armadillo // .parallel([parallel]), defaults 20
      August
      Berghaus // .lobes([lobes]) defaults 5
      Bertin1953
      Boggs
      Bonne // .parallel([parallel]) defaults 45
      Bottomley // .fraction([fraction]) Defaults to 0.5, corresponding to a sin(ψ) where ψ = π/6.
      Bromley
      Chamberlin // (point0, point1, point2)
      ChamberlinAfrica // for Africa using points [0°, 22°], [45°, 22°], [22.5°, -22°]
      Collignon
      Craig // .parallel([parallel]) default 0
      Craster
      CylindricalEqualArea // .parallel([parallel]) defaults 38.58°. Aber: Lambert cylindrical equal-area (0°), Behrmann (30°), Hobo–Dyer (37.5°), Gall–Peters (45°), Balthasart (50°) and Tobler world-in-a-square (~55.654°)
      CylindricalStereographic // .parallel([parallel]). Depending on the chosen parallel, this projection is also known as Braun’s stereographic (0°) and Gall’s stereographic (45°)

      Eckert1
      Eckert2
      Eckert3
      Eckert4
      Eckert5
      Eckert6
      Eisenlohr
      Fahey
      Foucaut
      FoucautSinusoidal // .alpha([alpha]) defaults: 0.5
      Gilbert([type]) // type defaults to  d3.geoOrthographic
      Gingery // .radius([radius]) defaults 30° und .lobes([lobes]) defaults 6. Braucht clipping der sphäre
      Ginzburg4
      Ginzburg5
      Ginzburg6
      Ginzburg8
      Ginzburg9
      Gringorten
      Guyou
      Hammer // .coefficient([coefficient]) defaults 2. Depending the chosen coefficient and aspect, also known as Eckert–Greifendorff, quartic authalic, and Briesemeister.
      HammerRetroazimuthal // .parallel([parallel]) Defaults to 45°.

      etc.
      */
