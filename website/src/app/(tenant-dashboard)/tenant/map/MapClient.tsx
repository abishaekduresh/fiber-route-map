'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  getTenantDeviceCategories, getTenantDeviceTypes, getUserSettings,
  getTenantRoutes, getTenantRoute, createTenantRoute, updateTenantRoute, deleteTenantRoute,
  getTenantIcons, getTenantRoutePointTemplates,
  IconData, DeviceCategoryData, DeviceTypeData, RoutePointTemplateData,
} from '@/lib/api';
import { useTenantAuth } from '@/components/providers/TenantAuthContext';
import type { MapMarker, RoutePolyline, RoutePointIcon } from './LeafletMap';
import MapSettingsPanel, { MapSettings, DEFAULT_MAP_SETTINGS } from '@/components/tenant-map/MapSettingsPanel';
import DrawSearchableSelect, { DSOption } from './DrawSearchableSelect';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PointModal, { PointDraft } from './PointModal';
import styles from './map.module.css';

// ── Role colours (compact list) ───────────────────────────────────────────────
const ROLE_COLORS: Record<string, { bg: string; chip: string; text: string }> = {
  start:    { bg: '#10b981', chip: 'rgba(16,185,129,0.15)',   text: '#10b981' },
  middle:   { bg: '#3b82f6', chip: 'rgba(59,130,246,0.15)',   text: '#3b82f6' },
  end:      { bg: '#ec4899', chip: 'rgba(236,72,153,0.15)',   text: '#ec4899' },
  junction: { bg: '#a78bfa', chip: 'rgba(167,139,250,0.15)', text: '#a78bfa' },
  pole:     { bg: '#f59e0b', chip: 'rgba(245,158,11,0.15)',   text: '#f59e0b' },
  device:   { bg: '#6b7280', chip: 'rgba(107,114,128,0.15)', text: '#9aa6b8' },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fitSvgInline(svg: string): string {
  return svg.replace(/<svg([^>]*)>/i, (_, attrs) =>
    `<svg${attrs.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:100%;height:100%">`
  );
}

const ROUTE_TYPE_OPTIONS: DSOption[] = [
  { value: 'fiber_route',        label: 'Fiber Route' },
  { value: 'coaxial_route',      label: 'Coaxial Route' },
  { value: 'backbone_route',     label: 'Backbone Route' },
  { value: 'distribution_route', label: 'Distribution Route' },
  { value: 'drop_route',         label: 'Drop Route' },
  { value: 'underground_duct',   label: 'Underground Duct' },
  { value: 'pole_to_pole',       label: 'Pole to Pole' },
];

// Fields driven by RPT flags — maps flag → storage key → display label
const RPT_FIELDS: Array<{
  flag:         keyof RoutePointTemplateData['attributes'];
  key:          string;
  label:        string;
  type?:        'text' | 'password' | 'number';
  placeholder?: string;
}> = [
  { flag: 'isPointNameRequired',   key: 'pointName',    label: 'Point Name',          placeholder: 'e.g. Junction Box A' },
  { flag: 'isDescriptionRequired', key: 'description',  label: 'Description',         placeholder: 'Brief description…' },
  { flag: 'isRemarksRequired',     key: 'remarks',      label: 'Remarks',             placeholder: 'Any remarks…' },
  { flag: 'isModelNumberRequired', key: 'modelNumber',  label: 'Model Number',        placeholder: 'e.g. CRS-1016' },
  { flag: 'isSerialNumberRequired',key: 'serialNumber', label: 'Serial Number',       placeholder: 'e.g. SN-123456' },
  { flag: 'isAssetTagRequired',    key: 'assetTag',     label: 'Asset Tag',           placeholder: 'e.g. AST-001' },
  { flag: 'isMacAddressRequired',  key: 'macAddress',   label: 'MAC Address',         placeholder: 'e.g. AA:BB:CC:DD:EE:FF' },
  { flag: 'isIpv4AddressRequired', key: 'ipv4',         label: 'IPv4 Address',        placeholder: 'e.g. 192.168.1.1' },
  { flag: 'isIpv6AddressRequired', key: 'ipv6',         label: 'IPv6 Address',        placeholder: 'e.g. fe80::1' },
  { flag: 'isSubnetRequired',      key: 'subnet',       label: 'Subnet',              placeholder: 'e.g. 255.255.255.0' },
  { flag: 'isGatewayRequired',     key: 'gateway',      label: 'Gateway',             placeholder: 'e.g. 192.168.1.254' },
  { flag: 'isVlanRequired',        key: 'vlan',         label: 'VLAN',                placeholder: 'e.g. 100' },
  { flag: 'isUsernameRequired',    key: 'username',     label: 'Username',            placeholder: 'Device username' },
  { flag: 'isPasswordRequired',    key: 'password',     label: 'Password',            type: 'password', placeholder: 'Device password' },
  { flag: 'isSnmpRequired',        key: 'snmp',         label: 'SNMP Community',      placeholder: 'e.g. public' },
  { flag: 'isPoleNumberRequired',  key: 'poleNumber',   label: 'Pole Number',         placeholder: 'e.g. P-042' },
  { flag: 'isLandmarkRequired',    key: 'landmark',     label: 'Landmark',            placeholder: 'Nearest landmark' },
  { flag: 'isAddressRequired',     key: 'address',      label: 'Address',             placeholder: 'Full address…' },
  { flag: 'isHeightRequired',      key: 'height',       label: 'Height (m)',          type: 'number', placeholder: 'e.g. 6' },
  { flag: 'isRackNumberRequired',  key: 'rackNumber',   label: 'Rack Number',         placeholder: 'e.g. R-01' },
  { flag: 'isPortRequired',        key: 'port',         label: 'Port',                placeholder: 'e.g. 8080' },
  { flag: 'isPowerSourceRequired', key: 'powerSource',  label: 'Power Source',        placeholder: 'e.g. Grid/Solar' },
  { flag: 'isElectricityRequired', key: 'electricity',  label: 'Electricity',         placeholder: 'e.g. Yes/No' },
  { flag: 'isSignalInputRequired', key: 'signalInput',  label: 'Signal Input (dBm)',  type: 'number', placeholder: 'e.g. -25.5' },
  { flag: 'isSignalOutputRequired',key: 'signalOutput', label: 'Signal Output (dBm)', type: 'number', placeholder: 'e.g. -10.0' },
  { flag: 'isAttenuationRequired', key: 'attenuation',  label: 'Attenuation (dB)',    type: 'number', placeholder: 'e.g. 3.5' },
  { flag: 'isFiberCoreRequired',   key: 'fiberCore',    label: 'Fiber Core',          placeholder: 'e.g. 12' },
];

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

// Always derive start/end from position; only trust stored type for custom middle roles
function resolvePointType(i: number, total: number, stored: string | undefined): string {
  if (i === 0) return 'start';
  if (i === total - 1) return 'end';
  return (stored && stored !== 'start' && stored !== 'end') ? stored : 'middle';
}

type LayerKey = 'street' | 'terrain' | 'dark';
type GeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported';

const LAYER_OPTIONS: { value: LayerKey; label: string }[] = [
  { value: 'street', label: 'Street' },
  { value: 'terrain', label: 'Terrain' },
  { value: 'dark', label: 'Dark' },
];

function parseSettings(raw: { key: string; value: string }[]): MapSettings {
  const m: Record<string, string> = {};
  raw.forEach((r) => { m[r.key] = r.value; });
  return {
    defaultLayer:        (m['map.defaultLayer'] as LayerKey) ?? DEFAULT_MAP_SETTINGS.defaultLayer,
    defaultZoom:         Number(m['map.defaultZoom']) || DEFAULT_MAP_SETTINGS.defaultZoom,
    showScaleBar:        m['map.showScaleBar'] !== undefined ? m['map.showScaleBar'] === 'true' : DEFAULT_MAP_SETTINGS.showScaleBar,
    scaleUnit:           (m['map.scaleUnit'] as 'metric' | 'imperial') ?? DEFAULT_MAP_SETTINGS.scaleUnit,
    autoCenterGPS:       m['map.autoCenterGPS'] !== undefined ? m['map.autoCenterGPS'] === 'true' : DEFAULT_MAP_SETTINGS.autoCenterGPS,
    filtersOpenByDefault:m['map.filtersOpenByDefault'] !== undefined ? m['map.filtersOpenByDefault'] === 'true' : DEFAULT_MAP_SETTINGS.filtersOpenByDefault,
  };
}

export default function MapClient() {
  const router = useRouter();
  const { hasPermission } = useTenantAuth();

  const canUpdateRoutes = hasPermission('tenant_routes.update');
  const canDeleteRoutes = hasPermission('tenant_routes.delete');

  useEffect(() => {
    if (!hasPermission('map.view')) {
      router.replace('/tenant/dashboard');
    }
  }, [hasPermission, router]);

  // ── Draw mode ────────────────────────────────────────────────────────────
  const [drawMode, setDrawMode]                           = useState(false);
  const [drawPoints, setDrawPoints]                       = useState<[number, number][]>([]);
  const [drawPointTemplates, setDrawPointTemplates]       = useState<string[]>([]);
  const [drawPointFieldData, setDrawPointFieldData]       = useState<Record<string, string>[]>([]);
  const [drawPointExpanded, setDrawPointExpanded]         = useState<boolean[]>([]);
  const [routes, setRoutes]                               = useState<RoutePolyline[]>([]);
  const [availableIcons, setAvailableIcons]               = useState<IconData[]>([]);
  const [routePointTemplates, setRoutePointTemplates]     = useState<RoutePointTemplateData[]>([]);
  const [drawName, setDrawName]                           = useState('');
  const [drawType, setDrawType]                           = useState('fiber_route');
  const [drawColor, setDrawColor]                         = useState('#3b82f6');
  const [drawThickness, setDrawThickness]                 = useState(2);
  const [drawParentUuid, setDrawParentUuid]               = useState('');
  const [drawDescription, setDrawDescription]             = useState('');
  const [isSaving, setIsSaving]                           = useState(false);
  const [saveError, setSaveError]                         = useState('');

  // ── Edit mode ────────────────────────────────────────────────────────────
  const [editMode, setEditMode]                           = useState(false);
  const [editRouteId, setEditRouteId]                     = useState('');
  const [editPoints, setEditPoints]                       = useState<[number, number][]>([]);
  const [editPointTemplates, setEditPointTemplates]       = useState<string[]>([]);
  const [editPointFieldData, setEditPointFieldData]       = useState<Record<string, string>[]>([]);
  const [editPointExpanded, setEditPointExpanded]         = useState<boolean[]>([]);
  const [editName, setEditName]                           = useState('');
  const [editType, setEditType]                           = useState('fiber_route');
  const [editColor, setEditColor]                         = useState('#3b82f6');
  const [editThickness, setEditThickness]                 = useState(2);
  const [editParentUuid, setEditParentUuid]               = useState('');
  const [editDescription, setEditDescription]             = useState('');
  const [editStatus, setEditStatus]                       = useState('active');
  const [editRouteCode, setEditRouteCode]                 = useState('');
  const [editPointTypes, setEditPointTypes]               = useState<string[]>([]);
  const [isSavingEdit, setIsSavingEdit]                   = useState(false);
  const [saveEditError, setSaveEditError]                 = useState('');
  const [pendingDeleteIdx, setPendingDeleteIdx]           = useState<number | null>(null);
  const [modalPointIdx, setModalPointIdx]                 = useState<number | null>(null);
  const [flyToPosition, setFlyToPosition]                 = useState<[number, number] | null>(null);

  type EditSnapshot = {
    points:    [number, number][];
    templates: string[];
    fieldData: Record<string, string>[];
    expanded:  boolean[];
    ptTypes:   string[];
  };
  const [editHistory, setEditHistory] = useState<EditSnapshot[]>([]);

  const [geoStatus, setGeoStatus]       = useState<GeoStatus>('idle');
  const [center, setCenter]             = useState<[number, number]>([0, 0]);
  const [heading, setHeading]           = useState<number | null>(null);
  const [accuracy, setAccuracy]         = useState<number>(0);
  const watchIdRef                      = useRef<number | null>(null);
  const [mapSettings, setMapSettings]   = useState<MapSettings>(DEFAULT_MAP_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [layer, setLayer]               = useState<LayerKey>(DEFAULT_MAP_SETTINGS.defaultLayer);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [showRoutes, setShowRoutes]     = useState(false);
  const [categories, setCategories]     = useState<DeviceCategoryData[]>([]);
  const [deviceTypes, setDeviceTypes]   = useState<DeviceTypeData[]>([]);
  const [filtersOpen, setFiltersOpen]   = useState(DEFAULT_MAP_SETTINGS.filtersOpenByDefault);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── Load saved settings from API ─────────────────────────────────────────
  useEffect(() => {
    getUserSettings().then((res) => {
      if (res.success && Array.isArray(res.data)) {
        const parsed = parseSettings(res.data.map((d) => ({ key: d.attributes.key, value: d.attributes.value })));
        setMapSettings(parsed);
        setLayer(parsed.defaultLayer);
        setFiltersOpen(parsed.filtersOpenByDefault);
      }
      setSettingsLoaded(true);
    }).catch(() => setSettingsLoaded(true));
  }, []);

  const handleSettingsApply = useCallback((s: MapSettings) => {
    setMapSettings(s);
    setLayer(s.defaultLayer);
    setFiltersOpen(s.filtersOpenByDefault);
  }, []);

  // ── Geolocation (continuous watch) ───────────────────────────────────────
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setGeoStatus('unsupported'); return; }
    setGeoStatus('requesting');
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCenter([pos.coords.latitude, pos.coords.longitude]);
        setAccuracy(pos.coords.accuracy);
        const h = pos.coords.heading;
        setHeading(h != null && !isNaN(h) ? h : null);
        setGeoStatus('granted');
      },
      () => setGeoStatus('denied'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    requestLocation();
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, [requestLocation]);

  // ── Fullscreen ───────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) wrapperRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── API data ─────────────────────────────────────────────────────────────
  const loadApiData = useCallback(async () => {
    const [catRes, dtRes, rptRes, routeRes, iconRes] = await Promise.all([
      getTenantDeviceCategories(),
      getTenantDeviceTypes(),
      getTenantRoutePointTemplates(),
      getTenantRoutes({ limit: -1 }),
      getTenantIcons(),
    ]);

    if (catRes.success && Array.isArray(catRes.data)) setCategories(catRes.data);

    const deviceTypeMap = new Map<string, DeviceTypeData>();
    if (dtRes.success && Array.isArray(dtRes.data)) {
      dtRes.data.forEach((dt: DeviceTypeData) => deviceTypeMap.set(dt.id, dt));
      setDeviceTypes(dtRes.data);
    }

    const rptMap = new Map<string, RoutePointTemplateData>();
    if (rptRes.success && Array.isArray(rptRes.data)) {
      rptRes.data.forEach((t: RoutePointTemplateData) => rptMap.set(t.id, t));
      setRoutePointTemplates(rptRes.data);
    }

    const iconMap = new Map<string, IconData>();
    if (iconRes.success && Array.isArray(iconRes.data)) {
      iconRes.data.forEach((w: IconData) => iconMap.set(w.id, w));
      setAvailableIcons(iconRes.data);
    }

    if (routeRes.success && Array.isArray(routeRes.data)) {
      const withPoints = routeRes.data.filter((r: any) => (r.attributes?.pointsCount ?? 0) > 0);
      const detailResults = await Promise.all(withPoints.map((r: any) => getTenantRoute(r.id)));
      const polylines: RoutePolyline[] = detailResults
        .filter((res) => res.success && res.data)
        .map((res): RoutePolyline => {
          const r = res.data as any;
          const pts: any[] = r.attributes.points ?? [];
          return {
            id:              r.id,
            label:           r.attributes.name,
            color:           r.attributes.routeColor || '#3b82f6',
            thickness:       r.attributes.lineThickness || 3,
            code:            r.attributes.code,
            type:            r.attributes.type,
            description:     r.attributes.description ?? null,
            status:          r.attributes.status,
            parentRouteName: r.attributes.parentRouteName ?? null,
            pointsCount:     r.attributes.pointsCount ?? pts.length,
            createdAt:       r.meta.createdAt,
            updatedAt:       r.meta.updatedAt,
            points:          pts.map((p) => [p.latitude, p.longitude] as [number, number]),
            routePoints: pts.map((p): RoutePointIcon => {
              // Icon resolution priority: explicit icon > RPT icon > device type icon
              const widget  = p.pointIcon               ? iconMap.get(p.pointIcon)                    : undefined;
              const rpt     = p.routePointTemplateUuid  ? rptMap.get(p.routePointTemplateUuid)         : undefined;
              const devType = p.deviceTypeUuid          ? deviceTypeMap.get(p.deviceTypeUuid)          : undefined;
              const dtAttrs = devType?.attributes;
              const rptAttrs = rpt?.attributes;
              return {
                lat:            p.latitude,
                lng:            p.longitude,
                pointType:      p.pointType,
                sequenceNumber: p.sequenceNumber,
                iconFileType: (widget?.attributes.iconType ?? (rptAttrs?.iconFileType ?? (dtAttrs?.iconFileType ?? null))) as ('svg' | 'png' | 'webp' | null),
                iconSvg:      widget?.attributes.svgTemplate ?? (rptAttrs?.iconSvgTemplate ?? (dtAttrs?.iconSvgTemplate ?? null)),
                iconUrl:      widget?.attributes.iconUrl ?? (rptAttrs?.iconUrl ?? (dtAttrs?.iconUrl ?? null)),
                iconWidth:    widget?.attributes.width ?? null,
                iconHeight:   widget?.attributes.height ?? null,
                iconName:     widget?.attributes.name ?? (rptAttrs?.iconName ?? null),
                deviceTypeName:   dtAttrs?.name ?? null,
                pointName:        p.fieldData?.pointName ?? p.pointName ?? null,
                pointDescription: p.fieldData?.description ?? p.pointDescription ?? null,
              };
            }),
          };
        })
        .filter((pl) => pl.points.length > 1);
      setRoutes(polylines);
    }
  }, []);

  useEffect(() => { loadApiData(); }, [loadApiData]);

  const refreshMap = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try { await loadApiData(); } finally { setIsRefreshing(false); }
  }, [isRefreshing, loadApiData]);

  const filteredDeviceTypes = useMemo(() => {
    if (!categoryFilter) return deviceTypes;
    return deviceTypes.filter((dt) => String(dt.attributes.deviceCategoryId) === categoryFilter);
  }, [deviceTypes, categoryFilter]);

  const handleCategoryChange = useCallback((val: string) => {
    setCategoryFilter(val); setDeviceTypeFilter('');
  }, []);

  const filteredMarkers = useMemo<MapMarker[]>(() => [], []);

  const filteredRoutes = useMemo(() => {
    let result = routes;
    if (statusFilter !== 'all') result = result.filter((r) => r.status === statusFilter);
    if (selectedRouteId)        result = result.filter((r) => r.id === selectedRouteId);
    return result;
  }, [routes, statusFilter, selectedRouteId]);

  const focusRoutePoints = useMemo<[number, number][] | null>(() => {
    if (!selectedRouteId) return null;
    return routes.find((r) => r.id === selectedRouteId)?.points ?? null;
  }, [selectedRouteId, routes]);

  const routeFilterOptions = useMemo<DSOption[]>(() => [
    { value: '', label: 'All routes' },
    ...routes
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .map((r) => ({ value: r.id, label: `[${r.code}] ${r.label}` })),
  ], [routes, statusFilter]);

  const activeCount   = 0;
  const inactiveCount = 0;

  // ── Searchable select option arrays ──────────────────────────────────────
  const parentRouteOptions = useMemo<DSOption[]>(() => [
    { value: '', label: 'None (No parent)' },
    ...routes.map((r) => ({ value: r.id, label: `[${r.code}] ${r.label}` })),
  ], [routes]);

  const rptOptions = useMemo<DSOption[]>(() => [
    { value: '', label: 'No template (optional)' },
    ...routePointTemplates.map((t) => ({
      value: t.id,
      label: `[${t.attributes.code}] ${t.attributes.name}`,
    })),
  ], [routePointTemplates]);

  // ── Edit mode handlers ───────────────────────────────────────────────────
  const handleEditRoute = useCallback(async (routeId: string) => {
    const res = await getTenantRoute(routeId);
    if (!res.success || !res.data) return;
    const r = res.data as any;
    const pts: any[] = r.attributes.points ?? [];
    setEditRouteId(routeId);
    setEditPoints(pts.map((p: any) => [Number(p.latitude), Number(p.longitude)] as [number, number]));
    setEditPointTemplates(pts.map((p: any) => p.routePointTemplateUuid || ''));
    setEditPointFieldData(pts.map((p: any) => {
      const fd: Record<string, string> = p.fieldData ? { ...p.fieldData } : {};
      // Backward compat: seed from legacy columns if fieldData is empty
      if (!fd.pointName && p.pointName)           fd.pointName   = p.pointName;
      if (!fd.description && p.pointDescription)  fd.description = p.pointDescription;
      if (!fd.remarks && p.remarks)               fd.remarks     = p.remarks;
      return fd;
    }));
    setEditPointExpanded(pts.map(() => false));
    // Store only custom middle types (junction/pole/device); start/end always resolved dynamically
    setEditPointTypes(pts.map((p: any) => {
      const t = p.pointType;
      return (t && t !== 'start' && t !== 'end') ? t : 'middle';
    }));
    setEditName(r.attributes.name);
    setEditType(r.attributes.type);
    setEditColor(r.attributes.routeColor || '#3b82f6');
    setEditThickness(r.attributes.lineThickness || 2);
    setEditParentUuid(r.attributes.parentRouteUuid || '');
    setEditDescription(r.attributes.description || '');
    setEditStatus(r.attributes.status || 'active');
    setEditRouteCode(r.attributes.code || '');
    setSaveEditError('');
    setEditHistory([]);
    setModalPointIdx(null);
    setFlyToPosition(null);
    setDrawMode(false);
    setEditMode(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setEditRouteId('');
    setEditRouteCode('');
    setEditPoints([]);
    setEditPointTemplates([]);
    setEditPointFieldData([]);
    setEditPointExpanded([]);
    setEditPointTypes([]);
    setSaveEditError('');
    setEditHistory([]);
    setModalPointIdx(null);
    setFlyToPosition(null);
  }, []);

  const handleDeleteRoute = useCallback(async (routeId: string) => {
    try {
      const res = await deleteTenantRoute(routeId);
      if (res.success) await loadApiData();
    } catch { /* best-effort */ }
  }, [loadApiData]);

  // Refs that always mirror current edit-point arrays — used for snapshot capture
  const _epRef  = useRef(editPoints);
  const _etRef  = useRef(editPointTemplates);
  const _efdRef = useRef(editPointFieldData);
  const _eexRef = useRef(editPointExpanded);
  const _eptRef = useRef(editPointTypes);
  useEffect(() => { _epRef.current  = editPoints; },         [editPoints]);
  useEffect(() => { _etRef.current  = editPointTemplates; }, [editPointTemplates]);
  useEffect(() => { _efdRef.current = editPointFieldData; }, [editPointFieldData]);
  useEffect(() => { _eexRef.current = editPointExpanded; },  [editPointExpanded]);
  useEffect(() => { _eptRef.current = editPointTypes; },     [editPointTypes]);

  const pushEditSnapshot = useCallback(() => {
    setEditHistory((h) => [...h, {
      points:    [..._epRef.current],
      templates: [..._etRef.current],
      fieldData: _efdRef.current.map((fd) => ({ ...fd })),
      expanded:  [..._eexRef.current],
      ptTypes:   [..._eptRef.current],
    }]);
  }, []);

  const onEditMapClick = useCallback((lat: number, lng: number) => {
    pushEditSnapshot();
    const newIdx = _epRef.current.length;
    setEditPoints((prev) => [...prev, [lat, lng]]);
    setEditPointTemplates((prev) => [...prev, '']);
    setEditPointFieldData((prev) => [...prev, {}]);
    setEditPointExpanded((prev) => [...prev.map(() => false), false]);
    setEditPointTypes((prev) => [...prev, 'middle']);
    setModalPointIdx(newIdx);
    setFlyToPosition([lat, lng]);
  }, [pushEditSnapshot]);

  const onEditPointMove = useCallback((idx: number, lat: number, lng: number) => {
    setEditPoints((prev) => prev.map((pt, i) => i === idx ? [lat, lng] as [number, number] : pt));
  }, []);

  const onInsertEditPoint = useCallback((afterIdx: number, lat: number, lng: number) => {
    pushEditSnapshot();
    const newIdx = afterIdx + 1;
    setEditPoints((prev) => [
      ...prev.slice(0, afterIdx + 1),
      [lat, lng] as [number, number],
      ...prev.slice(afterIdx + 1),
    ]);
    setEditPointTemplates((prev) => [...prev.slice(0, afterIdx + 1), '', ...prev.slice(afterIdx + 1)]);
    setEditPointFieldData((prev) => [...prev.slice(0, afterIdx + 1), {}, ...prev.slice(afterIdx + 1)]);
    setEditPointExpanded((prev) => [
      ...prev.slice(0, afterIdx + 1).map(() => false),
      false,
      ...prev.slice(afterIdx + 1).map(() => false),
    ]);
    setEditPointTypes((prev) => [...prev.slice(0, afterIdx + 1), 'middle', ...prev.slice(afterIdx + 1)]);
    setModalPointIdx(newIdx);
    setFlyToPosition([lat, lng]);
  }, [pushEditSnapshot]);

  const deleteEditPoint = useCallback((idx: number) => {
    setEditPoints((prev) => prev.filter((_, i) => i !== idx));
    setEditPointTemplates((prev) => prev.filter((_, i) => i !== idx));
    setEditPointFieldData((prev) => prev.filter((_, i) => i !== idx));
    setEditPointExpanded((prev) => prev.filter((_, i) => i !== idx));
    setEditPointTypes((prev) => prev.filter((_, i) => i !== idx));
    setModalPointIdx(null);
  }, []);

  const undoEditPoint = useCallback(() => {
    setEditHistory((h) => {
      if (h.length === 0) return h;
      const snap = h[h.length - 1];
      setEditPoints(snap.points);
      setEditPointTemplates(snap.templates);
      setEditPointFieldData(snap.fieldData);
      setEditPointExpanded(snap.expanded);
      setEditPointTypes(snap.ptTypes);
      return h.slice(0, -1);
    });
  }, []);

  // ── Point reorder / duplicate (compact list actions) ─────────────────────
  const swapEditPoints = useCallback((i: number, j: number) => {
    pushEditSnapshot();
    const swap = <T,>(arr: T[]) => arr.map((v, k) => k === i ? arr[j] : k === j ? arr[i] : v);
    setEditPoints((p) => swap(p));
    setEditPointTemplates((p) => swap(p));
    setEditPointFieldData((p) => swap(p));
    setEditPointExpanded((p) => swap(p));
    setEditPointTypes((p) => swap(p));
  }, [pushEditSnapshot]);

  const duplicateEditPoint = useCallback((idx: number) => {
    pushEditSnapshot();
    setEditPoints((p) => [...p.slice(0, idx + 1), [...p[idx]] as [number, number], ...p.slice(idx + 1)]);
    setEditPointTemplates((p) => [...p.slice(0, idx + 1), p[idx], ...p.slice(idx + 1)]);
    setEditPointFieldData((p) => [...p.slice(0, idx + 1), { ...p[idx] }, ...p.slice(idx + 1)]);
    setEditPointExpanded((p) => [...p.slice(0, idx + 1), false, ...p.slice(idx + 1)]);
    setEditPointTypes((p) => [...p.slice(0, idx + 1), p[idx] ?? 'middle', ...p.slice(idx + 1)]);
  }, [pushEditSnapshot]);

  const addEditPointNearLast = useCallback(() => {
    const last = _epRef.current[_epRef.current.length - 1] ?? center;
    const lat = last[0] + 0.0005;
    const lng = last[1] + 0.0005;
    pushEditSnapshot();
    const newIdx = _epRef.current.length;
    setEditPoints((p) => [...p, [lat, lng]]);
    setEditPointTemplates((p) => [...p, '']);
    setEditPointFieldData((p) => [...p, {}]);
    setEditPointExpanded((p) => [...p, false]);
    setEditPointTypes((p) => [...p, 'middle']);
    setModalPointIdx(newIdx);
    setFlyToPosition([lat, lng]);
  }, [pushEditSnapshot, center]);

  const openModalForPoint = useCallback((idx: number) => {
    setModalPointIdx(idx);
    const pt = _epRef.current[idx];
    if (pt) setFlyToPosition([...pt] as [number, number]);
  }, []);

  const setEditPointTemplate = useCallback((idx: number, val: string) => {
    setEditPointTemplates((prev) => prev.map((v, i) => i === idx ? val : v));
    // Clear field data when template changes
    setEditPointFieldData((prev) => prev.map((v, i) => i === idx ? {} : v));
  }, []);

  const setEditPointFieldValue = useCallback((idx: number, key: string, val: string) => {
    setEditPointFieldData((prev) => prev.map((fd, i) => i === idx ? { ...fd, [key]: val } : fd));
  }, []);

  const handleModalSave = useCallback((draft: PointDraft) => {
    if (modalPointIdx === null) return;
    const i = modalPointIdx;
    setEditPoints((p) => p.map((pt, k) => k === i ? [draft.latitude, draft.longitude] as [number, number] : pt));
    setEditPointTemplates((p) => p.map((t, k) => k === i ? draft.routePointTemplateUuid : t));
    setEditPointFieldData((p) => p.map((fd, k) => k === i ? { ...draft.fieldData, pointName: draft.pointName } : fd));
    setModalPointIdx(null);
  }, [modalPointIdx]);

  const handleModalNavigate = useCallback((delta: -1 | 1) => {
    setModalPointIdx((prev) => {
      if (prev === null) return null;
      const next = prev + delta;
      const pt = _epRef.current[next];
      if (pt) setFlyToPosition([...pt] as [number, number]);
      return next;
    });
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editName.trim()) { setSaveEditError('Route name is required.'); return; }
    if (editPoints.length < 2) { setSaveEditError('At least 2 points required.'); return; }
    setIsSavingEdit(true);
    setSaveEditError('');
    try {
      const points = editPoints.map((pt, i) => {
        const fd = editPointFieldData[i] ?? {};
        return {
          sequenceNumber:         i + 1,
          latitude:               pt[0],
          longitude:              pt[1],
          pointType:              resolvePointType(i, editPoints.length, editPointTypes[i]),
          routePointTemplateUuid: editPointTemplates[i] || null,
          fieldData:              Object.keys(fd).length > 0 ? fd : null,
          pointName:              fd.pointName        || null,
          pointDescription:       fd.description      || null,
          remarks:                fd.remarks           || null,
        };
      });
      const payload: Record<string, any> = {
        name:            editName.trim(),
        type:            editType,
        routeColor:      editColor,
        lineThickness:   editThickness,
        status:          editStatus,
        parentRouteUuid: editParentUuid || null,
        description:     editDescription.trim() || null,
        points,
      };
      const res = await updateTenantRoute(editRouteId, payload);
      if (!res.success) { setSaveEditError((res as any).message || 'Failed to save.'); return; }
      setEditMode(false);
      setEditRouteId('');
      setEditRouteCode('');
      setEditPoints([]);
      setEditPointTemplates([]);
      setEditPointFieldData([]);
      setEditPointExpanded([]);
      setEditPointTypes([]);
      setModalPointIdx(null);
      setFlyToPosition(null);
      await loadApiData();
    } catch {
      setSaveEditError('Failed to save.');
    } finally {
      setIsSavingEdit(false);
    }
  }, [editName, editType, editColor, editThickness, editStatus, editParentUuid, editDescription, editPoints, editPointTemplates, editPointFieldData, editRouteId, loadApiData]);

  // ── Draw mode handlers ───────────────────────────────────────────────────
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setDrawPoints((prev) => [...prev, [lat, lng]]);
    setDrawPointTemplates((prev) => [...prev, '']);
    setDrawPointFieldData((prev) => [...prev, {}]);
    setDrawPointExpanded((prev) => [...prev.map(() => false), true]);
  }, []);

  const startDraw = useCallback(() => {
    setEditMode(false);
    setEditRouteId('');
    setEditPoints([]);
    setEditPointTemplates([]);
    setEditPointFieldData([]);
    setDrawMode(true);
    setDrawPoints([]);
    setDrawPointTemplates([]);
    setDrawPointFieldData([]);
    setDrawPointExpanded([]);
    setDrawName('');
    setDrawType('fiber_route');
    setDrawColor('#3b82f6');
    setDrawThickness(2);
    setDrawParentUuid('');
    setDrawDescription('');
    setSaveError('');
  }, []);

  const cancelDraw = useCallback(() => {
    setDrawMode(false);
    setDrawPoints([]);
    setDrawPointTemplates([]);
    setDrawPointFieldData([]);
    setDrawPointExpanded([]);
    setSaveError('');
  }, []);

  const undoLastPoint = useCallback(() => {
    setDrawPoints((prev) => prev.slice(0, -1));
    setDrawPointTemplates((prev) => prev.slice(0, -1));
    setDrawPointFieldData((prev) => prev.slice(0, -1));
    setDrawPointExpanded((prev) => prev.slice(0, -1));
  }, []);

  const setPointTemplate = useCallback((idx: number, val: string) => {
    setDrawPointTemplates((prev) => prev.map((v, i) => i === idx ? val : v));
    // Clear field data when template changes
    setDrawPointFieldData((prev) => prev.map((fd, i) => i === idx ? {} : fd));
  }, []);

  const setPointFieldValue = useCallback((idx: number, key: string, val: string) => {
    setDrawPointFieldData((prev) => prev.map((fd, i) => i === idx ? { ...fd, [key]: val } : fd));
  }, []);

  const toggleDrawPointExpanded = useCallback((idx: number) => {
    setDrawPointExpanded((prev) => prev.map((v, i) => i === idx ? !v : v));
  }, []);

  const toggleEditPointExpanded = useCallback((idx: number) => {
    setEditPointExpanded((prev) => prev.map((v, i) => i === idx ? !v : v));
  }, []);

  const getPointType = (i: number, total: number) =>
    i === 0 ? 'start' : i === total - 1 ? 'end' : 'middle';

  const saveRoute = useCallback(async () => {
    if (!drawName.trim()) { setSaveError('Route name is required.'); return; }
    if (!drawType)        { setSaveError('Route type is required.'); return; }
    if (drawPoints.length < 2) { setSaveError('Add at least 2 points on the map.'); return; }
    setIsSaving(true);
    setSaveError('');
    try {
      const points = drawPoints.map((pt, i) => {
        const fd = drawPointFieldData[i] ?? {};
        return {
          sequenceNumber:         i + 1,
          latitude:               pt[0],
          longitude:              pt[1],
          pointType:              getPointType(i, drawPoints.length),
          routePointTemplateUuid: drawPointTemplates[i] || null,
          fieldData:              Object.keys(fd).length > 0 ? fd : null,
          pointName:              fd.pointName        || null,
          pointDescription:       fd.description      || null,
          remarks:                fd.remarks           || null,
        };
      });
      const payload: Record<string, any> = {
        name:          drawName.trim(),
        type:          drawType,
        routeColor:    drawColor,
        lineThickness: drawThickness,
        points,
      };
      if (drawParentUuid)         payload.parentRouteUuid = drawParentUuid;
      if (drawDescription.trim()) payload.description     = drawDescription.trim();

      const res = await createTenantRoute(payload);
      if (!res.success) { setSaveError((res as any).message || 'Failed to save route.'); return; }
      setDrawMode(false);
      setDrawPoints([]);
      setDrawPointTemplates([]);
      setDrawPointFieldData([]);
      setDrawPointExpanded([]);
      await loadApiData();
    } catch {
      setSaveError('Failed to save route.');
    } finally {
      setIsSaving(false);
    }
  }, [drawName, drawType, drawColor, drawThickness, drawParentUuid, drawDescription, drawPoints, drawPointTemplates, drawPointFieldData, loadApiData]);

  // ── Permission screens ───────────────────────────────────────────────────
  if (geoStatus === 'idle' || geoStatus === 'requesting') {
    return (
      <div className={styles.geoScreen}>
        <div className={styles.geoCard}>
          <div className={styles.geoIconWrap} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className={styles.geoTitle}>Location Access Required</h2>
          <p className={styles.geoDesc}>
            The Network Map requires your GPS location to display the map centred on your area.
            Please allow location access when prompted by your browser.
          </p>
          <div className={styles.geoSpinner} />
          <p className={styles.geoHint}>Waiting for location permission…</p>
        </div>
      </div>
    );
  }

  if (geoStatus === 'denied') {
    return (
      <div className={styles.geoScreen}>
        <div className={styles.geoCard}>
          <div className={styles.geoIconWrap} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2" />
            </svg>
          </div>
          <h2 className={styles.geoTitle}>Location Access Denied</h2>
          <p className={styles.geoDesc}>Location permission was denied. To use the Network Map you must allow location access.</p>
          <ol className={styles.geoSteps}>
            <li>Click the <strong>lock / info icon</strong> in your browser&apos;s address bar.</li>
            <li>Set <strong>Location</strong> to <strong>Allow</strong>.</li>
            <li>Reload this page.</li>
          </ol>
          <button className={styles.geoRetryBtn} onClick={requestLocation}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (geoStatus === 'unsupported') {
    return (
      <div className={styles.geoScreen}>
        <div className={styles.geoCard}>
          <div className={styles.geoIconWrap} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2 className={styles.geoTitle}>GPS Not Supported</h2>
          <p className={styles.geoDesc}>
            Your browser does not support the Geolocation API. Please use a modern browser such as Chrome, Firefox, or Safari.
          </p>
        </div>
      </div>
    );
  }

  // ── Main map UI (geoStatus === 'granted') ────────────────────────────────
  const effectiveZoom = settingsLoaded ? mapSettings.defaultZoom : DEFAULT_MAP_SETTINGS.defaultZoom;

  // Helper to render per-point expanded details (shared between draw/edit)
  const renderPointDetails = (
    i: number,
    pt: [number, number],
    templates: string[],
    fieldDataArr: Record<string, string>[],
    setTemplate: (idx: number, val: string) => void,
    setFieldValue: (idx: number, key: string, val: string) => void,
  ) => {
    const rpt      = templates[i] ? routePointTemplates.find((t) => t.id === templates[i]) : null;
    const fd       = fieldDataArr[i] ?? {};
    const rptAttrs = rpt?.attributes;

    return (
      <div className={styles.drawPointDetails}>
        {/* Route Point Template selector */}
        <div className={styles.drawPointField}>
          <span className={styles.drawPointFieldLabel}>Route Point Template</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <DrawSearchableSelect
                options={rptOptions}
                value={templates[i] ?? ''}
                onChange={(val) => setTemplate(i, val)}
                placeholder="Select template…"
                searchPlaceholder="Search templates…"
              />
            </div>
            {rptAttrs && (rptAttrs.iconSvgTemplate || rptAttrs.iconUrl) && (
              <span className={styles.drawPointIconPreview}>
                {rptAttrs.iconSvgTemplate
                  ? <span dangerouslySetInnerHTML={{ __html: fitSvgInline(rptAttrs.iconSvgTemplate) }} style={{ display: 'flex', width: 22, height: 22 }} />
                  : <img src={rptAttrs.iconUrl || ''} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}
              </span>
            )}
          </div>
        </div>

        {/* Dynamic fields based on selected RPT flags */}
        {rptAttrs && RPT_FIELDS.map(({ flag, key, label, type, placeholder }) => {
          if (!rptAttrs[flag]) return null;
          return (
            <div key={key} className={styles.drawPointField}>
              <span className={styles.drawPointFieldLabel}>{label}</span>
              <input
                type={type ?? 'text'}
                className={styles.drawInput}
                placeholder={placeholder}
                value={fd[key] ?? ''}
                onChange={(e) => setFieldValue(i, key, e.target.value)}
              />
            </div>
          );
        })}

        {/* GPS location — always shown as read-only if flag enabled */}
        {rptAttrs?.isGpsLocationRequired && (
          <div className={styles.drawPointField}>
            <span className={styles.drawPointFieldLabel}>GPS Location</span>
            <div className={styles.drawPointCoordRow} style={{ marginTop: 0 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {pt[0].toFixed(5)}, {pt[1].toFixed(5)}
            </div>
          </div>
        )}

        {/* Coordinates footer */}
        <div className={styles.drawPointCoordRow}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {pt[0].toFixed(5)}, {pt[1].toFixed(5)}
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.wrapper} ${isFullscreen ? styles.wrapperFullscreen : ''}`} ref={wrapperRef}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Network Map</h2>
          <p className={styles.subtitle}>
            {filteredMarkers.length} node{filteredMarkers.length !== 1 ? 's' : ''} visible
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.stats}>
            <div className={styles.statBadge} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>
              <span className={styles.statDot} style={{ background: '#10b981' }} />{activeCount} Active
            </div>
            <div className={styles.statBadge} style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
              <span className={styles.statDot} style={{ background: '#ef4444' }} />{inactiveCount} Inactive
            </div>
          </div>
          {/* Draw Route */}
          {hasPermission('tenant_routes.create') && (
            drawMode ? (
              <button className={styles.drawActiveBtn} onClick={cancelDraw} title="Cancel drawing">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                Cancel Draw
              </button>
            ) : (
              <button className={styles.drawBtn} onClick={startDraw} title="Draw a new route on the map">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 17L21 17M3 7l6 4 6-4 6 4" />
                </svg>
                Draw Route
              </button>
            )
          )}
          {/* Refresh */}
          <button
            className={styles.fullscreenBtn}
            onClick={refreshMap}
            title="Refresh map"
            disabled={isRefreshing}
            style={{ opacity: isRefreshing ? 0.6 : 1 }}
          >
            <svg
              width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}
            >
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
          </button>
          {/* Settings */}
          <button
            className={`${styles.fullscreenBtn} ${settingsPanelOpen ? styles.headerBtnActive : ''}`}
            onClick={() => setSettingsPanelOpen((o) => !o)}
            title="Map settings"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
            </svg>
          </button>
          {/* Fullscreen */}
          <button className={styles.fullscreenBtn} onClick={toggleFullscreen} title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className={styles.body}>
        {/* Filter panel */}
        <aside className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : styles.filtersClosed}`}>
          <div className={styles.filtersHeader}>
            <span className={styles.filtersTitle}>Filters</span>
            <button className={styles.filtersToggle} onClick={() => setFiltersOpen((o) => !o)} title="Toggle filters">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {filtersOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {filtersOpen && (
            <div className={styles.filtersBody}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Map Layer</label>
                <div className={styles.layerButtons}>
                  {LAYER_OPTIONS.map((opt) => (
                    <button key={opt.value} className={`${styles.layerBtn} ${layer === opt.value ? styles.layerBtnActive : ''}`} onClick={() => setLayer(opt.value)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.filterGroup}>
                <div className={styles.filterLabelRow}>
                  <label className={styles.filterLabel}>Routes</label>
                  <button
                    className={`${styles.routeToggle} ${showRoutes ? styles.routeToggleOn : ''}`}
                    onClick={() => setShowRoutes((o) => !o)}
                  >
                    {showRoutes ? (
                      <><span className={styles.routeToggleDot} />Visible</>
                    ) : (
                      <><span className={styles.routeToggleDot} />Hidden</>
                    )}
                  </button>
                </div>
                {showRoutes && (
                  <>
                    <DrawSearchableSelect
                      options={routeFilterOptions}
                      value={selectedRouteId}
                      onChange={setSelectedRouteId}
                      placeholder="All routes"
                      searchPlaceholder="Search routes…"
                    />
                    <span className={styles.routeMatchCount}>
                      {filteredRoutes.length} / {routes.length} route{routes.length !== 1 ? 's' : ''} visible
                    </span>
                  </>
                )}
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Status</label>
                <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Device Category</label>
                <select className={styles.filterSelect} value={categoryFilter} onChange={(e) => handleCategoryChange(e.target.value)}>
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.attributes.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Device Type</label>
                <select className={styles.filterSelect} value={deviceTypeFilter} onChange={(e) => setDeviceTypeFilter(e.target.value)}>
                  <option value="">All Types</option>
                  {filteredDeviceTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>{dt.attributes.name} ({dt.attributes.code})</option>
                  ))}
                </select>
              </div>

              {(statusFilter !== 'all' || categoryFilter || deviceTypeFilter || selectedRouteId || showRoutes) && (
                <button className={styles.clearBtn} onClick={() => { setStatusFilter('all'); setCategoryFilter(''); setDeviceTypeFilter(''); setSelectedRouteId(''); setShowRoutes(false); }}>
                  Clear all filters
                </button>
              )}

              <div className={styles.legend}>
                <div className={styles.filterLabel} style={{ marginBottom: '0.5rem' }}>Legend</div>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#10b981' }} /><span>Active node</span></div>
                <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#ef4444' }} /><span>Inactive node</span></div>
              </div>
            </div>
          )}
        </aside>

        {/* Map area */}
        <div className={styles.mapArea}>
          <LeafletMap
            layer={layer}
            markers={filteredMarkers}
            center={center}
            zoom={effectiveZoom}
            showScaleBar={mapSettings.showScaleBar}
            scaleUnit={mapSettings.scaleUnit}
            userLocation={{ position: center, heading, accuracy }}
            drawMode={drawMode}
            drawPoints={drawPoints}
            onMapClick={handleMapClick}
            routes={showRoutes ? filteredRoutes : []}
            onEditRoute={handleEditRoute}
            canEditRoutes={canUpdateRoutes}
            onDeleteRoute={handleDeleteRoute}
            canDeleteRoutes={canDeleteRoutes}
            editMode={editMode}
            editRouteId={editRouteId}
            editPoints={editPoints}
            editRouteColor={editColor}
            editRouteThickness={editThickness}
            onEditMapClick={onEditMapClick}
            onEditPointMove={onEditPointMove}
            onInsertEditPoint={onInsertEditPoint}
            onEditPointClick={openModalForPoint}
            focusPoints={focusRoutePoints}
            flyToPosition={flyToPosition}
          />

          {/* ── Edit mode panel ─────────────────────────────────────────── */}
          {editMode && (
            <div className={styles.drawPanel}>
              <div className={styles.drawPanelBody}>
              <div className={styles.drawPanelHeader}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>Edit Route</span>
                <span className={styles.drawPointCount}>{editPoints.length} pts</span>
                <button
                  onClick={cancelEdit}
                  title="Close"
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: '0 2px', fontSize: '1.1rem', lineHeight: 1, display: 'flex', alignItems: 'center' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className={styles.drawHint}>Drag points to move · Click/drag midpoint handle to insert · Click map to add at end.</p>

              <div className={styles.drawField}>
                <label>Route Name <span className={styles.req}>*</span></label>
                <input type="text" className={styles.drawInput} value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>

              <div className={styles.drawField}>
                <label>Type <span className={styles.req}>*</span></label>
                <DrawSearchableSelect options={ROUTE_TYPE_OPTIONS} value={editType} onChange={setEditType} searchPlaceholder="Search type…" />
              </div>

              <div className={styles.drawField}>
                <label>Status</label>
                <select className={styles.drawInput} value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={{ cursor: 'pointer' }}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className={styles.drawField}>
                <label>Parent Route</label>
                <DrawSearchableSelect options={parentRouteOptions} value={editParentUuid} onChange={setEditParentUuid} placeholder="None (No parent)" searchPlaceholder="Search routes…" />
              </div>

              <div className={styles.drawFieldRow}>
                <div className={styles.drawField} style={{ flex: 1 }}>
                  <label>Color <span className={styles.req}>*</span></label>
                  <div className={styles.drawColorRow}>
                    <input type="color" className={styles.drawColorPicker} value={editColor} onChange={(e) => setEditColor(e.target.value)} />
                    <span className={styles.drawColorHex}>{editColor}</span>
                  </div>
                </div>
                <div className={styles.drawField} style={{ flex: 1 }}>
                  <label>Thickness <span className={styles.req}>*</span> <span className={styles.drawThickVal}>{editThickness}px</span></label>
                  <input type="range" min={1} max={12} value={editThickness} onChange={(e) => setEditThickness(Number(e.target.value))} className={styles.drawRange} />
                </div>
              </div>

              <div className={styles.drawField}>
                <label>Description <span className={styles.opt}>(optional)</span></label>
                <textarea className={styles.drawTextarea} rows={2} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>

              {/* ── Compact points list ────────────────────────────── */}
              {editPoints.length > 0 && (
                <div className={styles.compactList}>
                  <div className={styles.compactListHeader}>
                    <span className={styles.compactListTitle}>Points</span>
                    <span className={styles.compactListCount}>{editPoints.length}</span>
                    {editHistory.length > 0 && (
                      <button className={styles.drawUndoInlineBtn} onClick={undoEditPoint} title="Undo">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M3 7v6h6" /><path d="M3 13C5.33 9.33 8.5 7 12 7c4.42 0 8 3.58 8 8" />
                        </svg>
                        Undo
                      </button>
                    )}
                  </div>

                  <div className={styles.compactListScroll}>
                    {editPoints.map((pt, i) => {
                      const ptType = resolvePointType(i, editPoints.length, editPointTypes[i]);
                      const fd     = editPointFieldData[i] ?? {};
                      const rpt    = editPointTemplates[i] ? routePointTemplates.find((t) => t.id === editPointTemplates[i]) : null;
                      const rc     = ROLE_COLORS[ptType] ?? ROLE_COLORS.middle;
                      const isActive = modalPointIdx === i;

                      return (
                        <div
                          key={i}
                          className={`${styles.compactRow} ${isActive ? styles.compactRowActive : ''}`}
                          style={{ '--row-role-color': rc.bg } as React.CSSProperties}
                          onClick={() => openModalForPoint(i)}
                        >
                          {/* Drag handle */}
                          <span className={styles.compactDrag} onClick={(e) => e.stopPropagation()}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                          </span>

                          {/* Role chip */}
                          <span className={styles.compactChip} style={{ background: rc.bg }}>{i + 1}</span>

                          {/* Name + meta */}
                          <div className={styles.compactInfo}>
                            <div className={styles.compactName}>
                              <span>{fd.pointName || `Point ${i + 1}`}</span>
                              <span className={styles.compactRolePill}
                                style={{ background: rc.chip, color: rc.text }}>
                                {ptType}
                              </span>
                            </div>
                            <div className={styles.compactMeta}>
                              {rpt && <><span>{rpt.attributes.code}</span><span className={styles.compactMetaSep}>·</span></>}
                              <span>{pt[0].toFixed(4)}, {pt[1].toFixed(4)}</span>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className={styles.compactActions} onClick={(e) => e.stopPropagation()}>
                            <button className={`${styles.compactActBtn} ${styles.compactActBtnDanger}`} title="Delete"
                              onClick={() => setPendingDeleteIdx(i)}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add point row */}
                  <div className={styles.compactAddRow} onClick={addEditPointNearLast}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add point
                  </div>
                </div>
              )}

              </div>{/* end drawPanelBody */}
              <div className={styles.drawPanelFooter}>
                {saveEditError && <p className={styles.drawError}>{saveEditError}</p>}
                <div className={styles.drawActions}>
                  <button className={styles.drawUndoBtn} onClick={cancelEdit}>Cancel</button>
                  <button className={styles.drawSaveBtn} onClick={saveEdit} disabled={isSavingEdit || editPoints.length < 2}>
                    {isSavingEdit ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Draw mode save panel ────────────────────────────────────── */}
          {drawMode && (
            <div className={styles.drawPanel}>
              <div className={styles.drawPanelBody}>
              <div className={styles.drawPanelHeader}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 17L21 17M3 7l6 4 6-4 6 4" />
                </svg>
                <span>Drawing Route</span>
                <span className={styles.drawPointCount}>{drawPoints.length} pts</span>
              </div>
              <p className={styles.drawHint}>Click on the map to place route points.</p>

              <div className={styles.drawField}>
                <label>Route Name <span className={styles.req}>*</span></label>
                <input
                  type="text"
                  className={styles.drawInput}
                  placeholder="e.g. Main Backbone"
                  value={drawName}
                  onChange={(e) => setDrawName(e.target.value)}
                />
              </div>

              <div className={styles.drawField}>
                <label>Type <span className={styles.req}>*</span></label>
                <DrawSearchableSelect
                  options={ROUTE_TYPE_OPTIONS}
                  value={drawType}
                  onChange={setDrawType}
                  searchPlaceholder="Search type…"
                />
              </div>

              <div className={styles.drawField}>
                <label>Parent Route</label>
                <DrawSearchableSelect
                  options={parentRouteOptions}
                  value={drawParentUuid}
                  onChange={setDrawParentUuid}
                  placeholder="None (No parent)"
                  searchPlaceholder="Search routes…"
                />
              </div>

              <div className={styles.drawFieldRow}>
                <div className={styles.drawField} style={{ flex: 1 }}>
                  <label>Color <span className={styles.req}>*</span></label>
                  <div className={styles.drawColorRow}>
                    <input type="color" className={styles.drawColorPicker} value={drawColor} onChange={(e) => setDrawColor(e.target.value)} />
                    <span className={styles.drawColorHex}>{drawColor}</span>
                  </div>
                </div>
                <div className={styles.drawField} style={{ flex: 1 }}>
                  <label>Thickness <span className={styles.req}>*</span> <span className={styles.drawThickVal}>{drawThickness}px</span></label>
                  <input
                    type="range"
                    min={1} max={12}
                    value={drawThickness}
                    onChange={(e) => setDrawThickness(Number(e.target.value))}
                    className={styles.drawRange}
                  />
                </div>
              </div>

              <div className={styles.drawField}>
                <label>Description <span className={styles.opt}>(optional)</span></label>
                <textarea
                  className={styles.drawTextarea}
                  placeholder="Notes about this route…"
                  rows={2}
                  value={drawDescription}
                  onChange={(e) => setDrawDescription(e.target.value)}
                />
              </div>

              {/* Captured points list */}
              {drawPoints.length > 0 && (
                <div className={styles.drawPointsList}>
                  <div className={styles.drawPointsHeader}>
                    <span>Points</span>
                    <span className={styles.drawPointsCount}>{drawPoints.length}</span>
                  </div>
                  <div className={styles.drawPointsScroll}>
                    {drawPoints.map((pt, i) => {
                      const ptType     = getPointType(i, drawPoints.length);
                      const isExpanded = drawPointExpanded[i] ?? false;
                      const fd         = drawPointFieldData[i] ?? {};
                      const rpt        = drawPointTemplates[i] ? routePointTemplates.find((t) => t.id === drawPointTemplates[i]) : null;
                      const hasData    = !!(drawPointTemplates[i] || Object.values(fd).some(Boolean));
                      const rptAttrs   = rpt?.attributes;

                      return (
                        <div key={i} className={styles.drawPointRow} data-type={ptType}>
                          {/* Always-visible row header */}
                          <div className={styles.drawPointMeta}>
                            <span className={styles.drawSeq}>{i + 1}</span>
                            <span className={`${styles.drawPtType} ${styles[`ptType_${ptType}`]}`}>{ptType}</span>
                            {fd.pointName ? (
                              <span className={styles.drawPointLabel}>{fd.pointName}</span>
                            ) : (
                              <span className={styles.drawCoords}>{pt[0].toFixed(4)}, {pt[1].toFixed(4)}</span>
                            )}
                            {/* Inline RPT icon preview when collapsed */}
                            {!isExpanded && rptAttrs && rptAttrs.iconSvgTemplate && (
                              <span className={styles.drawPointInlineIcon}>
                                <span dangerouslySetInnerHTML={{ __html: fitSvgInline(rptAttrs.iconSvgTemplate) }} style={{ display: 'flex', width: 14, height: 14 }} />
                              </span>
                            )}
                            {!isExpanded && rptAttrs && !rptAttrs.iconSvgTemplate && rptAttrs.iconUrl && (
                              <span className={styles.drawPointInlineIcon}>
                                <img src={rptAttrs.iconUrl} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                              </span>
                            )}
                            {hasData && !isExpanded && <span className={styles.drawPointDataDot} title="Has data" />}
                            <button className={styles.drawPointExpandBtn} onClick={() => toggleDrawPointExpanded(i)} title={isExpanded ? 'Collapse' : 'Expand'}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.15s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                          </div>
                          {/* Expandable details */}
                          {isExpanded && renderPointDetails(i, pt, drawPointTemplates, drawPointFieldData, setPointTemplate, setPointFieldValue)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              </div>{/* end drawPanelBody */}
              <div className={styles.drawPanelFooter}>
                {saveError && <p className={styles.drawError}>{saveError}</p>}
                <div className={styles.drawActions}>
                  <button className={styles.drawUndoBtn} onClick={undoLastPoint} disabled={drawPoints.length === 0}>
                    Undo
                  </button>
                  <button className={styles.drawSaveBtn} onClick={saveRoute} disabled={isSaving || drawPoints.length < 2}>
                    {isSaving ? 'Saving…' : 'Save Route'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Point modal ────────────────────────────────────────────────── */}
      {editMode && modalPointIdx !== null && editPoints[modalPointIdx] && (() => {
        const i  = modalPointIdx;
        const pt = editPoints[i];
        const fd = editPointFieldData[i] ?? {};
        const draft: PointDraft = {
          latitude:               pt[0],
          longitude:              pt[1],
          pointType:              resolvePointType(i, editPoints.length, editPointTypes[i]),
          pointName:              fd.pointName ?? '',
          routePointTemplateUuid: editPointTemplates[i] ?? '',
          fieldData:              { ...fd },
        };
        return (
          <PointModal
            draft={draft}
            pointIndex={i}
            totalPoints={editPoints.length}
            routeCode={editRouteCode}
            templates={routePointTemplates}
            rptFields={RPT_FIELDS}
            onSave={handleModalSave}
            onDelete={() => { deleteEditPoint(i); }}
            onClose={() => setModalPointIdx(null)}
            onNavigate={handleModalNavigate}
          />
        );
      })()}

      {/* Settings panel */}
      <MapSettingsPanel
        isOpen={settingsPanelOpen}
        onClose={() => setSettingsPanelOpen(false)}
        current={mapSettings}
        onApply={handleSettingsApply}
      />

      {/* Remove point confirm */}
      <ConfirmDialog
        isOpen={pendingDeleteIdx !== null}
        title="Remove Point"
        message={pendingDeleteIdx !== null ? `Remove point #${pendingDeleteIdx + 1} from the route?` : ''}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={() => { if (pendingDeleteIdx !== null) { deleteEditPoint(pendingDeleteIdx); setPendingDeleteIdx(null); } }}
        onCancel={() => setPendingDeleteIdx(null)}
      />
    </div>
  );
}
