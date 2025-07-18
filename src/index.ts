import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const NWS_API_BASE = "https://api.weather.gov";
const USER_AGENT = "weather-mcp-server/2.0";

// 缓存配置
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存
const cache = new Map<string, { data: any; timestamp: number }>();

// 常用城市坐标映射
const CITY_COORDINATES: Record<string, { lat: number; lon: number; name: string }> = {
  "new york": { lat: 40.7128, lon: -74.0060, name: "New York City" },
  "nyc": { lat: 40.7128, lon: -74.0060, name: "New York City" },
  "los angeles": { lat: 34.0522, lon: -118.2437, name: "Los Angeles" },
  "la": { lat: 34.0522, lon: -118.2437, name: "Los Angeles" },
  "chicago": { lat: 41.8781, lon: -87.6298, name: "Chicago" },
  "houston": { lat: 29.7604, lon: -95.3698, name: "Houston" },
  "phoenix": { lat: 33.4484, lon: -112.0740, name: "Phoenix" },
  "philadelphia": { lat: 39.9526, lon: -75.1652, name: "Philadelphia" },
  "san antonio": { lat: 29.4241, lon: -98.4936, name: "San Antonio" },
  "san diego": { lat: 32.7157, lon: -117.1611, name: "San Diego" },
  "dallas": { lat: 32.7767, lon: -96.7970, name: "Dallas" },
  "san jose": { lat: 37.3382, lon: -121.8863, name: "San Jose" },
  "austin": { lat: 30.2672, lon: -97.7431, name: "Austin" },
  "jacksonville": { lat: 30.3322, lon: -81.6557, name: "Jacksonville" },
  "san francisco": { lat: 37.7749, lon: -122.4194, name: "San Francisco" },
  "sf": { lat: 37.7749, lon: -122.4194, name: "San Francisco" },
  "columbus": { lat: 39.9612, lon: -82.9988, name: "Columbus" },
  "charlotte": { lat: 35.2271, lon: -80.8431, name: "Charlotte" },
  "fort worth": { lat: 32.7555, lon: -97.3308, name: "Fort Worth" },
  "indianapolis": { lat: 39.7684, lon: -86.1581, name: "Indianapolis" },
  "seattle": { lat: 47.6062, lon: -122.3321, name: "Seattle" },
  "denver": { lat: 39.7392, lon: -104.9903, name: "Denver" },
  "boston": { lat: 42.3601, lon: -71.0589, name: "Boston" },
  "el paso": { lat: 31.7619, lon: -106.4850, name: "El Paso" },
  "detroit": { lat: 42.3314, lon: -83.0458, name: "Detroit" },
  "nashville": { lat: 36.1627, lon: -86.7816, name: "Nashville" },
  "portland": { lat: 45.5152, lon: -122.6784, name: "Portland" },
  "oklahoma city": { lat: 35.4676, lon: -97.5164, name: "Oklahoma City" },
  "las vegas": { lat: 36.1699, lon: -115.1398, name: "Las Vegas" },
  "louisville": { lat: 38.2527, lon: -85.7585, name: "Louisville" },
  "baltimore": { lat: 39.2904, lon: -76.6122, name: "Baltimore" },
  "milwaukee": { lat: 43.0389, lon: -87.9065, name: "Milwaukee" },
  "albuquerque": { lat: 35.0844, lon: -106.6504, name: "Albuquerque" },
  "tucson": { lat: 32.2226, lon: -110.9747, name: "Tucson" },
  "fresno": { lat: 36.7378, lon: -119.7871, name: "Fresno" },
  "sacramento": { lat: 38.5816, lon: -121.4944, name: "Sacramento" },
  "kansas city": { lat: 39.0997, lon: -94.5786, name: "Kansas City" },
  "mesa": { lat: 33.4152, lon: -111.8315, name: "Mesa" },
  "atlanta": { lat: 33.7490, lon: -84.3880, name: "Atlanta" },
  "colorado springs": { lat: 38.8339, lon: -104.8214, name: "Colorado Springs" },
  "raleigh": { lat: 35.7796, lon: -78.6382, name: "Raleigh" },
  "omaha": { lat: 41.2565, lon: -95.9345, name: "Omaha" },
  "miami": { lat: 25.7617, lon: -80.1918, name: "Miami" },
  "long beach": { lat: 33.7701, lon: -118.1937, name: "Long Beach" },
  "virginia beach": { lat: 36.8529, lon: -75.9780, name: "Virginia Beach" },
  "oakland": { lat: 37.8044, lon: -122.2711, name: "Oakland" },
  "minneapolis": { lat: 44.9778, lon: -93.2650, name: "Minneapolis" },
  "tulsa": { lat: 36.1540, lon: -95.9928, name: "Tulsa" },
  "tampa": { lat: 27.9506, lon: -82.4572, name: "Tampa" },
  "arlington": { lat: 32.7357, lon: -97.1081, name: "Arlington" },
  "new orleans": { lat: 29.9511, lon: -90.0715, name: "New Orleans" }
};

// 创建 server instance
const server = new McpServer({
  name: "weather",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Helper function 用于缓存检查
function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  return null;
}

// Helper function 用于设置缓存
function setCachedData<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// Helper function 用于发送 NWS API 请求（带缓存）
async function makeNWSRequest<T>(url: string): Promise<T | null> {
  // 检查缓存
  const cachedData = getCachedData<T>(url);
  if (cachedData) {
    console.error(`Cache hit for: ${url}`);
    return cachedData;
  }

  const headers = {
    "User-Agent": USER_AGENT,
    Accept: "application/geo+json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as T;

    // 缓存数据
    setCachedData(url, data);
    console.error(`API call made for: ${url}`);

    return data;
  } catch (error) {
    console.error("Error making NWS request:", error);
    return null;
  }
}

// Helper function 用于查找城市坐标
function findCityCoordinates(cityName: string): { lat: number; lon: number; name: string } | null {
  const normalizedName = cityName.toLowerCase().trim();
  return CITY_COORDINATES[normalizedName] || null;
}

// Helper function 用于格式化温度
function formatTemperature(temp: number | undefined, unit: string | undefined): string {
  if (temp === undefined) return "Unknown";
  const celsius = unit === "F" ? Math.round((temp - 32) * 5 / 9) : temp;
  return `${temp}°${unit || "F"} (${celsius}°C)`;
}

interface AlertFeature {
  properties: {
    event?: string;
    areaDesc?: string;
    severity?: string;
    status?: string;
    headline?: string;
  };
}

// 格式化警报数据
function formatAlert(feature: AlertFeature): string {
  const props = feature.properties;
  return [
    `Event: ${props.event || "Unknown"}`,
    `Area: ${props.areaDesc || "Unknown"}`,
    `Severity: ${props.severity || "Unknown"}`,
    `Status: ${props.status || "Unknown"}`,
    `Headline: ${props.headline || "No headline"}`,
    "---",
  ].join("\n");
}

interface ForecastPeriod {
  name?: string;
  temperature?: number;
  temperatureUnit?: string;
  windSpeed?: string;
  windDirection?: string;
  shortForecast?: string;
}

interface AlertsResponse {
  features: AlertFeature[];
}

interface PointsResponse {
  properties: {
    forecast?: string;
    gridId?: string;
    gridX?: number;
    gridY?: number;
  };
}

interface ForecastResponse {
  properties: {
    periods: ForecastPeriod[];
  };
}

// 注册天气 tools
server.tool(
  "get-alerts",
  "获取美国某个州的活跃天气警报，包括洪水、暴风雨、高温等各类气象警报信息",
  {
    state: z.string().length(2).describe("两个字母的州代码（例如 CA、NY、TX、FL）"),
  },
  async ({ state }) => {
    const stateCode = state.toUpperCase();
    const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
    const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

    if (!alertsData) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 无法获取 ${stateCode} 州的天气警报数据。请稍后重试。`,
          },
        ],
      };
    }

    const features = alertsData.features || [];
    if (features.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `✅ ${stateCode} 州目前没有活跃的天气警报。`,
          },
        ],
      };
    }

    // 按严重程度分类警报
    const severityOrder = { "Severe": 3, "Moderate": 2, "Minor": 1, "Unknown": 0 };
    const sortedFeatures = features.sort((a, b) => {
      const severityA = severityOrder[a.properties.severity as keyof typeof severityOrder] || 0;
      const severityB = severityOrder[b.properties.severity as keyof typeof severityOrder] || 0;
      return severityB - severityA;
    });

    const formattedAlerts = sortedFeatures.map(formatAlert);
    const alertCount = features.length;
    const severeCount = features.filter(f => f.properties.severity === "Severe").length;

    const summary = severeCount > 0
      ? `🚨 ${stateCode} 州有 ${alertCount} 个活跃警报，其中 ${severeCount} 个为严重级别`
      : `⚠️ ${stateCode} 州有 ${alertCount} 个活跃警报`;

    const alertsText = `${summary}\n\n${formattedAlerts.join("\n")}`;

    return {
      content: [
        {
          type: "text",
          text: alertsText,
        },
      ],
    };
  },
);

server.tool(
  "get-forecast",
  "获取美国任意位置的详细天气预报，包括温度、风速、风向、天气状况等7天预报信息",
  {
    latitude: z.number().min(-90).max(90).describe("位置的纬度（美国境内）"),
    longitude: z.number().min(-180).max(180).describe("位置的经度（美国境内）"),
  },
  async ({ latitude, longitude }) => {
    // 获取网格点数据
    const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

    if (!pointsData) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 无法获取坐标 ${latitude}, ${longitude} 的网格点数据。\n\n可能原因：\n• 该位置不在美国境内（NWS API 仅支持美国）\n• 坐标格式错误\n• 网络连接问题\n\n请确认坐标是否正确且位于美国境内。`,
          },
        ],
      };
    }

    const forecastUrl = pointsData.properties?.forecast;
    if (!forecastUrl) {
      return {
        content: [
          {
            type: "text",
            text: "❌ 无法从网格点数据中获取预报URL，请稍后重试。",
          },
        ],
      };
    }

    // 获取预报数据
    const forecastData = await makeNWSRequest<ForecastResponse>(forecastUrl);
    if (!forecastData) {
      return {
        content: [
          {
            type: "text",
            text: "❌ 无法获取天气预报数据，请稍后重试。",
          },
        ],
      };
    }

    const periods = forecastData.properties?.periods || [];
    if (periods.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "❌ 该位置暂无可用的天气预报数据。",
          },
        ],
      };
    }

    // 格式化预报 periods，使用改进的温度格式化
    const formattedForecast = periods.map((period: ForecastPeriod) => {
      const temp = formatTemperature(period.temperature, period.temperatureUnit);
      const wind = period.windSpeed && period.windDirection
        ? `${period.windSpeed} ${period.windDirection}`
        : period.windSpeed || "Unknown";

      return [
        `📅 **${period.name || "Unknown"}**`,
        `🌡️ 温度: ${temp}`,
        `💨 风速: ${wind}`,
        `☁️ 天气: ${period.shortForecast || "No forecast available"}`,
        "---",
      ].join("\n");
    });

    const locationName = `坐标 ${latitude}, ${longitude}`;
    const forecastText = `🌤️ **${locationName} 天气预报**\n\n${formattedForecast.join("\n")}`;

    return {
      content: [
        {
          type: "text",
          text: forecastText,
        },
      ],
    };
  },
);

// 新增：通过城市名称获取天气预报
server.tool(
  "get-city-forecast",
  "通过城市名称获取美国主要城市的天气预报，支持常见城市如纽约、洛杉矶、芝加哥等",
  {
    cityName: z.string().describe("城市名称（英文），如 'New York', 'Los Angeles', 'Chicago', 'Sacramento' 等"),
  },
  async ({ cityName }) => {
    const cityInfo = findCityCoordinates(cityName);

    if (!cityInfo) {
      // 提供一些建议的城市
      const suggestions = Object.values(CITY_COORDINATES)
        .slice(0, 10)
        .map(city => city.name)
        .join(", ");

      return {
        content: [
          {
            type: "text",
            text: `❌ 未找到城市 "${cityName}" 的坐标信息。\n\n支持的城市示例：${suggestions}\n\n如果您的城市不在列表中，请使用 get-forecast 工具并提供具体的经纬度坐标。`,
          },
        ],
      };
    }

    // 获取网格点数据
    const pointsUrl = `${NWS_API_BASE}/points/${cityInfo.lat.toFixed(4)},${cityInfo.lon.toFixed(4)}`;
    const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

    if (!pointsData) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 无法获取 ${cityInfo.name} 的天气数据，请稍后重试。`,
          },
        ],
      };
    }

    const forecastUrl = pointsData.properties?.forecast;
    if (!forecastUrl) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 无法获取 ${cityInfo.name} 的预报URL，请稍后重试。`,
          },
        ],
      };
    }

    // 获取预报数据
    const forecastData = await makeNWSRequest<ForecastResponse>(forecastUrl);
    if (!forecastData) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 无法获取 ${cityInfo.name} 的天气预报数据，请稍后重试。`,
          },
        ],
      };
    }

    const periods = forecastData.properties?.periods || [];
    if (periods.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: `❌ ${cityInfo.name} 暂无可用的天气预报数据。`,
          },
        ],
      };
    }

    // 格式化预报，只显示前6个时段（约3天）
    const limitedPeriods = periods.slice(0, 6);
    const formattedForecast = limitedPeriods.map((period: ForecastPeriod) => {
      const temp = formatTemperature(period.temperature, period.temperatureUnit);
      const wind = period.windSpeed && period.windDirection
        ? `${period.windSpeed} ${period.windDirection}`
        : period.windSpeed || "Unknown";

      return [
        `📅 **${period.name || "Unknown"}**`,
        `🌡️ 温度: ${temp}`,
        `💨 风速: ${wind}`,
        `☁️ 天气: ${period.shortForecast || "No forecast available"}`,
        "---",
      ].join("\n");
    });

    const forecastText = `🌤️ **${cityInfo.name} 天气预报**\n📍 坐标: ${cityInfo.lat}, ${cityInfo.lon}\n\n${formattedForecast.join("\n")}`;

    return {
      content: [
        {
          type: "text",
          text: forecastText,
        },
      ],
    };
  },
);

// 新增：获取当前天气状况
server.tool(
  "get-current-weather",
  "获取指定位置的当前天气状况，包括实时温度、湿度、风速、能见度等详细信息",
  {
    latitude: z.number().min(-90).max(90).describe("位置的纬度（美国境内）"),
    longitude: z.number().min(-180).max(180).describe("位置的经度（美国境内）"),
  },
  async ({ latitude, longitude }) => {
    // 获取网格点数据
    const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

    if (!pointsData) {
      return {
        content: [
          {
            type: "text",
            text: `❌ 无法获取坐标 ${latitude}, ${longitude} 的网格点数据。请确认坐标是否位于美国境内。`,
          },
        ],
      };
    }

    // 获取观测站信息
    const gridId = pointsData.properties?.gridId;
    const gridX = pointsData.properties?.gridX;
    const gridY = pointsData.properties?.gridY;

    if (!gridId || !gridX || !gridY) {
      return {
        content: [
          {
            type: "text",
            text: "❌ 无法获取网格信息，请稍后重试。",
          },
        ],
      };
    }

    // 获取当前观测数据
    const observationsUrl = `${NWS_API_BASE}/gridpoints/${gridId}/${gridX},${gridY}/stations`;
    const stationsData = await makeNWSRequest<any>(observationsUrl);

    if (!stationsData || !stationsData.features || stationsData.features.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "❌ 该位置附近没有可用的气象观测站。",
          },
        ],
      };
    }

    // 获取最近观测站的当前观测数据
    const stationId = stationsData.features[0].properties.stationIdentifier;
    const currentObsUrl = `${NWS_API_BASE}/stations/${stationId}/observations/latest`;
    const currentData = await makeNWSRequest<any>(currentObsUrl);

    if (!currentData || !currentData.properties) {
      return {
        content: [
          {
            type: "text",
            text: "❌ 无法获取当前天气观测数据，请稍后重试。",
          },
        ],
      };
    }

    const obs = currentData.properties;
    const timestamp = new Date(obs.timestamp).toLocaleString();

    // 格式化当前天气信息
    const temperature = obs.temperature?.value ?
      `${Math.round(obs.temperature.value)}°C (${Math.round(obs.temperature.value * 9/5 + 32)}°F)` :
      "Unknown";

    const humidity = obs.relativeHumidity?.value ?
      `${Math.round(obs.relativeHumidity.value)}%` :
      "Unknown";

    const windSpeed = obs.windSpeed?.value ?
      `${Math.round(obs.windSpeed.value * 3.6)} km/h` :
      "Unknown";

    const windDirection = obs.windDirection?.value ?
      `${Math.round(obs.windDirection.value)}°` :
      "Unknown";

    const visibility = obs.visibility?.value ?
      `${Math.round(obs.visibility.value / 1000)} km` :
      "Unknown";

    const pressure = obs.barometricPressure?.value ?
      `${Math.round(obs.barometricPressure.value / 100)} hPa` :
      "Unknown";

    const weatherText = [
      `🌤️ **坐标 ${latitude}, ${longitude} 当前天气**`,
      `📍 观测站: ${stationId}`,
      `🕐 观测时间: ${timestamp}`,
      "",
      `🌡️ **温度**: ${temperature}`,
      `💧 **湿度**: ${humidity}`,
      `💨 **风速**: ${windSpeed}`,
      `🧭 **风向**: ${windDirection}`,
      `👁️ **能见度**: ${visibility}`,
      `📊 **气压**: ${pressure}`,
      "",
      `📝 **天气描述**: ${obs.textDescription || "无描述"}`,
    ].join("\n");

    return {
      content: [
        {
          type: "text",
          text: weatherText,
        },
      ],
    };
  },
);

// 新增：获取天气摘要（结合警报和预报）
server.tool(
  "get-weather-summary",
  "获取指定州的完整天气摘要，包括活跃警报和主要城市的天气预报概览",
  {
    state: z.string().length(2).describe("两个字母的州代码（例如 CA、NY、TX、FL）"),
  },
  async ({ state }) => {
    const stateCode = state.toUpperCase();

    // 获取警报数据
    const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
    const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

    let alertsSummary = "";
    if (alertsData && alertsData.features && alertsData.features.length > 0) {
      const alertCount = alertsData.features.length;
      const severeCount = alertsData.features.filter(f => f.properties.severity === "Severe").length;
      const alertTypes = [...new Set(alertsData.features.map(f => f.properties.event).filter(Boolean))];

      alertsSummary = severeCount > 0
        ? `🚨 **警报状态**: ${alertCount} 个活跃警报（${severeCount} 个严重级别）\n📋 **警报类型**: ${alertTypes.slice(0, 5).join(", ")}${alertTypes.length > 5 ? "等" : ""}`
        : `⚠️ **警报状态**: ${alertCount} 个活跃警报\n📋 **警报类型**: ${alertTypes.slice(0, 5).join(", ")}${alertTypes.length > 5 ? "等" : ""}`;
    } else {
      alertsSummary = "✅ **警报状态**: 当前无活跃天气警报";
    }

    // 获取该州主要城市的天气（如果有的话）
    const stateCities = Object.entries(CITY_COORDINATES).filter(([key]) => {
      // 简单的州匹配逻辑，基于城市名称
      const stateMapping: Record<string, string[]> = {
        "CA": ["los angeles", "la", "san francisco", "sf", "san diego", "san jose", "sacramento", "fresno", "long beach", "oakland"],
        "NY": ["new york", "nyc"],
        "TX": ["houston", "san antonio", "dallas", "austin", "fort worth", "el paso", "arlington"],
        "FL": ["jacksonville", "miami", "tampa"],
        "IL": ["chicago"],
        "AZ": ["phoenix", "tucson", "mesa"],
        "PA": ["philadelphia"],
        "OH": ["columbus"],
        "NC": ["charlotte", "raleigh"],
        "IN": ["indianapolis"],
        "WA": ["seattle"],
        "CO": ["denver", "colorado springs"],
        "MA": ["boston"],
        "MI": ["detroit"],
        "TN": ["nashville"],
        "OR": ["portland"],
        "OK": ["oklahoma city", "tulsa"],
        "NV": ["las vegas"],
        "KY": ["louisville"],
        "MD": ["baltimore"],
        "WI": ["milwaukee"],
        "NM": ["albuquerque"],
        "MO": ["kansas city"],
        "GA": ["atlanta"],
        "NE": ["omaha"],
        "VA": ["virginia beach"],
        "MN": ["minneapolis"],
        "LA": ["new orleans"]
      };

      return stateMapping[stateCode]?.includes(key) || false;
    });

    let citiesWeather = "";
    if (stateCities.length > 0) {
      // 只获取前2个城市的简要天气
      const cityPromises = stateCities.slice(0, 2).map(async ([, city]) => {
        const pointsUrl = `${NWS_API_BASE}/points/${city.lat.toFixed(4)},${city.lon.toFixed(4)}`;
        const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

        if (pointsData?.properties?.forecast) {
          const forecastData = await makeNWSRequest<ForecastResponse>(pointsData.properties.forecast);
          if (forecastData?.properties?.periods?.[0]) {
            const current = forecastData.properties.periods[0];
            const temp = formatTemperature(current.temperature, current.temperatureUnit);
            return `🏙️ **${city.name}**: ${temp}, ${current.shortForecast || "无描述"}`;
          }
        }
        return `🏙️ **${city.name}**: 数据暂不可用`;
      });

      const cityResults = await Promise.all(cityPromises);
      citiesWeather = `\n\n🌆 **主要城市天气**:\n${cityResults.join("\n")}`;
    }

    const summaryText = [
      `🌤️ **${stateCode} 州天气摘要**`,
      "",
      alertsSummary,
      citiesWeather,
      "",
      "💡 **提示**: 使用 get-alerts 获取详细警报信息，使用 get-city-forecast 获取具体城市预报"
    ].join("\n");

    return {
      content: [
        {
          type: "text",
          text: summaryText,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});