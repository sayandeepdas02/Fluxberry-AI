export interface KPIData {
    value: string | number; // Changed to allow formatted strings if needed, though number is better for calc
    trend?: {
        direction: 'up' | 'down';
        percentage: number;
    } | null;
}

export interface HiringActivityData {
    months: string[];
    thisYear: number[];
    lastYear: number[];
}

export interface ApplicationSource {
    name: string;
    value: number; // Represents percentage or raw count
}

export interface DeviceTraffic {
    device: string;
    count: number;
}

export interface LocationTraffic {
    country: string;
    percentage: number;
}

export const kpiData = {
    activeJobs: {
        value: "7,265",
        trend: { direction: 'up' as const, percentage: 11.01 }
    },
    totalCandidates: {
        value: "3,671",
        trend: { direction: 'down' as const, percentage: 0.03 }
    },
    applications: {
        value: "256",
        trend: { direction: 'up' as const, percentage: 15.03 }
    },
    candidatesAwaitingReview: {
        value: "2,318",
        trend: { direction: 'up' as const, percentage: 6.08 }
    },
};

export const hiringActivityData: HiringActivityData = {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    thisYear: [12000, 14000, 8000, 12000, 24000, 20000, 25000],
    lastYear: [5000, 13000, 12000, 20000, 5000, 24000, 30000],
};

export const applicationSourcesData: ApplicationSource[] = [
    { name: 'Linkedin', value: 45 },
    { name: 'Indeed', value: 25 },
    { name: 'Naukri', value: 15 },
    { name: 'Your Portal', value: 30 }, // Visual approximation from screenshot
    { name: 'Twitter', value: 5 },
];

export const trafficByDeviceData: DeviceTraffic[] = [
    { device: 'Linux', count: 18000 },
    { device: 'Mac', count: 30000 },
    { device: 'iOS', count: 22000 },
    { device: 'Windows', count: 42000 },
    { device: 'Android', count: 15000 },
    { device: 'Other', count: 26000 },
];

export const trafficByLocationData: LocationTraffic[] = [
    { country: 'United States', percentage: 52.1 },
    { country: 'Canada', percentage: 22.8 },
    { country: 'Mexico', percentage: 13.9 },
    { country: 'Other', percentage: 11.2 },
];
