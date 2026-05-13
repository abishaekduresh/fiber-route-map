'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { getDeviceCategories, getDeviceTypes, getUserSettings, getTenantRoutes, getTenantRoute, createTenantRoute, updateTenantRoute, deleteTenantRoute, getTenantIcons, IconData, DeviceCategoryData, DeviceTypeData } from '@/lib/api';
import { useTenantAuth } from '@/components/providers/TenantAuthContext';
import type { MapMarker, RoutePolyline, RoutePointIcon } from './LeafletMap';
import MapSettingsPanel, { MapSettings, DEFAULT_MAP_SETTINGS } from '@/components/tenant-map/MapSettingsPanel';
import DrawSearchableSelect, { DSOption } from './DrawSearchableSelect';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import styles from './map.module.css';
import dsStyles from './drawSelect.module.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fitSvgInline(svg: string): string {
  return svg.replace(/<svg([^>]*)>/i, (_, attrs) =>
    `<svg${attrs.replace(/\s+(width|height)="[^"]*"/gi, '')} style="width:100%;height:100%">`
  );
}

const ROUTE_TYPE_OPTIONS: DSOption[] = [
  { value: 'fiber_route',       label: 'Fiber Route' },
  { value: 'coaxial_route',     label: 'Coaxial Route' },
  { value: 'backbone_route',    label: 'Backbone Route' },
  { value: 'distribution_route',label: 'Distribution Route' },
  { value: 'drop_route',        label: 'Drop Route' },
  { value: 'underground_duct',  label: 'Underground Duct' },
  { value: 'pole_to_pole',      label: 'Pole to Pole' },
];

const LeafletMap = dynamic(() => import('./LeafletMap'), { ssr: false });

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
    defaultLayer: (m['map.defaultLayer'] as LayerKey) ?? DEFAULT_MAP_SETTINGS.defaultLayer,
    defaultZoom:  Number(m['map.defaultZoom'])  || DEFAULT_MAP_SETTINGS.defaultZoom,
    showScaleBar: m['map.showScaleBar'] !== undefined ? m['map.showScaleBar'] === 'true' : DEFAULT_MAP_SETTINGS.showScaleBar,
    scaleUnit:    (m['map.scaleUnit'] as 'metric' | 'imperial') ?? DEFAULT_MAP_SETTINGS.scaleUnit,
    autoCenterGPS: m['map.autoCenterGPS'] !== undefined ? m['map.autoCenterGPS'] === 'true' : DEFAULT_MAP_SETTINGS.autoCenterGPS,
    filtersOpenByDefault: m['map.filtersOpenByDefault'] !== undefined ? m['map.filtersOpenByDefault'] === 'true' : DEFAULT_MAP_SETTINGS.filtersOpenByDefault,
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
  const [drawMode, setDrawMode]             = useState(false);
  const [drawPoints, setDrawPoints]         = useState<[number, number][]>([]);
  const [drawPointIcons, setDrawPointIcons]               = useState<string[]>([]);
  const [drawPointDeviceTypes, setDrawPointDeviceTypes]   = useState<string[]>([]);
  const [drawPointNames, setDrawPointNames]               = useState<string[]>([]);
  const [drawPointDescriptions, setDrawPointDescriptions] = useState<string[]>([]);
  const [drawPointExpanded, setDrawPointExpanded]         = useState<boolean[]>([]);
  const [routes, setRoutes]                 = useState<RoutePolyline[]>([]);
  const [availableIcons, setAvailableIcons] = useState<IconData[]>([]);
  const [drawName, setDrawName]             = useState('');
  const [drawType, setDrawType]             = useState('fiber_route');
  const [drawColor, setDrawColor]           = useState('#3b82f6');
  const [drawThickness, setDrawThickness]   = useState(2);
  const [drawParentUuid, setDrawParentUuid] = useState('');
  const [drawDescription, setDrawDescription] = useState('');
  const [isSaving, setIsSaving]             = useState(false);
  const [saveError, setSaveError]           = useState('');

  // ── Edit mode ────────────────────────────────────────────────────────────
  const [editMode, setEditMode]               = useState(false);
  const [editRouteId, setEditRouteId]         = useState('');
  const [editPoints, setEditPoints]           = useState<[number, number][]>([]);
  const [editPointIcons, setEditPointIcons]               = useState<string[]>([]);
  const [editPointDeviceTypes, setEditPointDeviceTypes]   = useState<string[]>([]);
  const [editPointNames, setEditPointNames]               = useState<string[]>([]);
  const [editPointDescriptions, setEditPointDescriptions] = useState<string[]>([]);
  const [editPointExpanded, setEditPointExpanded]         = useState<boolean[]>([]);
  const [editName, setEditName]               = useState('');
  const [editType, setEditType]               = useState('fiber_route');
  const [editColor, setEditColor]             = useState('#3b82f6');
  const [editThickness, setEditThickness]     = useState(2);
  const [editParentUuid, setEditParentUuid]   = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus]           = useState('active');
  const [isSavingEdit, setIsSavingEdit]       = useState(false);
  const [saveEditError, setSaveEditError]     = useState('');
  const [pendingDeleteIdx, setPendingDeleteIdx] = useState<number | null>(null);

  type EditSnapshot = { points: [number,number][]; icons: string[]; deviceTypes: string[]; names: string[]; descriptions: string[]; expanded: boolean[] };
  const [editHistory, setEditHistory] = useState<EditSnapshot[]>([]);

  const [geoStatus, setGeoStatus]       = useState<GeoStatus>('idle');
  const [center, setCenter]             = useState<[number, number]>([0, 0]);
  const [heading, setHeading]           = useState<number | null>(null);
  const [accuracy, setAccuracy]         = useState<number>(0);
  const watchIdRef                      = useRef<number | null>(null);
  const [mapSettings, setMapSettings]   = useState<MapSettings>(DEFAULT_MAP_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Active layer/zoom can diverge from saved defaults after user interacts
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
    const [catRes, dtRes, routeRes, iconRes] = await Promise.all([
      getDeviceCategories({ limit: -1 }),
      getDeviceTypes({ limit: -1 }),
      getTenantRoutes({ limit: -1 }),
      getTenantIcons(),
    ]);
    if (catRes.success && Array.isArray(catRes.data)) setCategories(catRes.data);

    // Build uuid→deviceType lookup for icon fallback
    const deviceTypeMap = new Map<string, DeviceTypeData>();
    if (dtRes.success && Array.isArray(dtRes.data)) {
      dtRes.data.forEach((dt: DeviceTypeData) => deviceTypeMap.set(dt.id, dt));
      setDeviceTypes(dtRes.data);
    }

    // Build uuid→icon lookup for icon resolution
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
              const widget  = p.pointIcon      ? iconMap.get(p.pointIcon)             : undefined;
              const devType = p.deviceTypeUuid ? deviceTypeMap.get(p.deviceTypeUuid)  : undefined;
              const dtAttrs = devType?.attributes;
              return {
                lat:            p.latitude,
                lng:            p.longitude,
                pointType:      p.pointType,
                sequenceNumber: p.sequenceNumber,
                iconFileType: widget?.attributes.iconType ?? (dtAttrs?.iconFileType ?? null),
                iconSvg:      widget?.attributes.svgTemplate ?? (dtAttrs?.iconSvgTemplate ?? null),
                iconUrl:      widget?.attributes.iconUrl ?? (dtAttrs?.iconUrl ?? null),
                iconWidth:    widget?.attributes.width ?? null,
                iconHeight:   widget?.attributes.height ?? null,
                iconName:     widget?.attributes.name ?? null,
                deviceTypeName:   dtAttrs?.name ?? null,
                pointName:        p.pointName        ?? null,
                pointDescription: p.pointDescription ?? null,
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
    try {
      await loadApiData();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, loadApiData]);

  const filteredDeviceTypes = useMemo(() => {
    if (!categoryFilter) return deviceTypes;
    return deviceTypes.filter((dt) => String(dt.attributes.tenantDeviceCategoryId) === categoryFilter);
  }, [deviceTypes, categoryFilter]);

  const handleCategoryChange = useCallback((val: string) => {
    setCategoryFilter(val); setDeviceTypeFilter('');
  }, []);

  const filteredMarkers = useMemo<MapMarker[]>(() => [], []);

  const filteredRoutes = useMemo(() => {
    let result = routes;
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (selectedRouteId) {
      result = result.filter((r) => r.id === selectedRouteId);
    }
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

  // ── Searchable select option arrays ─────────────────────────────────────
  // Parent route list always uses all routes (not the filtered subset)
  const parentRouteOptions = useMemo<DSOption[]>(() => [
    { value: '', label: 'None (No parent)' },
    ...routes.map((r) => ({ value: r.id, label: `[${r.code}] ${r.label}` })),
  ], [routes]);

  const deviceTypeOptions = useMemo<DSOption[]>(() => [
    { value: '', label: 'No device type (optional)' },
    ...deviceTypes.map((dt) => ({
      value: dt.id,
      label: `[${dt.attributes.code}] ${dt.attributes.name}`,
    })),
  ], [deviceTypes]);

  const iconOptions = useMemo<DSOption[]>(() => [
    { value: '', label: 'No icon' },
    ...availableIcons.filter((w) => w.attributes.type === 'route_point').map((w) => ({
      value: w.id,
      label: `[${w.attributes.code}] ${w.attributes.name}`,
      renderOption: () => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
          <span className={dsStyles.iconPreview}>
            {w.attributes.iconType === 'svg'
              ? <span dangerouslySetInnerHTML={{ __html: fitSvgInline(w.attributes.svgTemplate || '') }} style={{ display: 'flex', width: 22, height: 22 }} />
              : <img src={w.attributes.iconUrl || ''} alt={w.attributes.name} />
            }
          </span>
          <span className={dsStyles.iconMeta}>
            <span className={dsStyles.iconName}>{w.attributes.name}</span>
            <span className={dsStyles.iconCode}>{w.attributes.code}</span>
          </span>
        </span>
      ),
    })),
  ], [availableIcons]);

  const handleEditRoute = useCallback(async (routeId: string) => {
    const res = await getTenantRoute(routeId);
    if (!res.success || !res.data) return;
    const r = res.data as any;
    const pts: any[] = r.attributes.points ?? [];
    setEditRouteId(routeId);
    setEditPoints(pts.map((p: any) => [Number(p.latitude), Number(p.longitude)] as [number, number]));
    setEditPointIcons(pts.map((p: any) => p.pointIcon || ''));
    setEditPointDeviceTypes(pts.map((p: any) => p.deviceTypeUuid || ''));
    setEditPointNames(pts.map((p: any) => p.pointName || ''));
    setEditPointDescriptions(pts.map((p: any) => p.pointDescription || ''));
    setEditPointExpanded(pts.map(() => false)); // all collapsed on load
    setEditName(r.attributes.name);
    setEditType(r.attributes.type);
    setEditColor(r.attributes.routeColor || '#3b82f6');
    setEditThickness(r.attributes.lineThickness || 2);
    setEditParentUuid(r.attributes.parentRouteUuid || '');
    setEditDescription(r.attributes.description || '');
    setEditStatus(r.attributes.status || 'active');
    setSaveEditError('');
    setEditHistory([]);
    setDrawMode(false);
    setEditMode(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditMode(false);
    setEditRouteId('');
    setEditPoints([]);
    setEditPointIcons([]);
    setEditPointDeviceTypes([]);
    setEditPointNames([]);
    setEditPointDescriptions([]);
    setEditPointExpanded([]);
    setSaveEditError('');
    setEditHistory([]);
  }, []);

  const handleDeleteRoute = useCallback(async (routeId: string) => {
    try {
      const res = await deleteTenantRoute(routeId);
      if (res.success) await loadApiData();
    } catch { /* best-effort */ }
  }, [loadApiData]);

  // Refs that always mirror current edit-point arrays — used for snapshot capture
  const _epRef   = useRef(editPoints);
  const _eiRef   = useRef(editPointIcons);
  const _edtRef  = useRef(editPointDeviceTypes);
  const _enRef   = useRef(editPointNames);
  const _edRef   = useRef(editPointDescriptions);
  useEffect(() => { _epRef.current  = editPoints; },            [editPoints]);
  useEffect(() => { _eiRef.current  = editPointIcons; },        [editPointIcons]);
  useEffect(() => { _edtRef.current = editPointDeviceTypes; },  [editPointDeviceTypes]);
  useEffect(() => { _enRef.current  = editPointNames; },        [editPointNames]);
  useEffect(() => { _edRef.current  = editPointDescriptions; }, [editPointDescriptions]);

  const _eexRef = useRef(editPointExpanded);
  useEffect(() => { _eexRef.current = editPointExpanded; }, [editPointExpanded]);

  const pushEditSnapshot = useCallback(() => {
    setEditHistory((h) => [...h, {
      points:       [..._epRef.current],
      icons:        [..._eiRef.current],
      deviceTypes:  [..._edtRef.current],
      names:        [..._enRef.current],
      descriptions: [..._edRef.current],
      expanded:     [..._eexRef.current],
    }]);
  }, []);

  const onEditMapClick = useCallback((lat: number, lng: number) => {
    pushEditSnapshot();
    setEditPoints((prev) => [...prev, [lat, lng]]);
    setEditPointIcons((prev) => [...prev, '']);
    setEditPointDeviceTypes((prev) => [...prev, '']);
    setEditPointNames((prev) => [...prev, '']);
    setEditPointDescriptions((prev) => [...prev, '']);
    setEditPointExpanded((prev) => [...prev.map(() => false), true]); // collapse all, expand new
  }, [pushEditSnapshot]);

  const onEditPointMove = useCallback((idx: number, lat: number, lng: number) => {
    setEditPoints((prev) => prev.map((pt, i) => i === idx ? [lat, lng] as [number, number] : pt));
  }, []);

  const onInsertEditPoint = useCallback((afterIdx: number, lat: number, lng: number) => {
    pushEditSnapshot();
    setEditPoints((prev) => [
      ...prev.slice(0, afterIdx + 1),
      [lat, lng] as [number, number],
      ...prev.slice(afterIdx + 1),
    ]);
    setEditPointIcons((prev) => [...prev.slice(0, afterIdx + 1), '', ...prev.slice(afterIdx + 1)]);
    setEditPointDeviceTypes((prev) => [...prev.slice(0, afterIdx + 1), '', ...prev.slice(afterIdx + 1)]);
    setEditPointNames((prev) => [...prev.slice(0, afterIdx + 1), '', ...prev.slice(afterIdx + 1)]);
    setEditPointDescriptions((prev) => [...prev.slice(0, afterIdx + 1), '', ...prev.slice(afterIdx + 1)]);
    setEditPointExpanded((prev) => [
      ...prev.slice(0, afterIdx + 1).map(() => false),
      true, // new inserted point expanded
      ...prev.slice(afterIdx + 1).map(() => false),
    ]);
  }, [pushEditSnapshot]);

  const deleteEditPoint = useCallback((idx: number) => {
    setEditPoints((prev) => prev.filter((_, i) => i !== idx));
    setEditPointIcons((prev) => prev.filter((_, i) => i !== idx));
    setEditPointDeviceTypes((prev) => prev.filter((_, i) => i !== idx));
    setEditPointNames((prev) => prev.filter((_, i) => i !== idx));
    setEditPointDescriptions((prev) => prev.filter((_, i) => i !== idx));
    setEditPointExpanded((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const undoEditPoint = useCallback(() => {
    setEditHistory((h) => {
      if (h.length === 0) return h;
      const snap = h[h.length - 1];
      setEditPoints(snap.points);
      setEditPointIcons(snap.icons);
      setEditPointDeviceTypes(snap.deviceTypes);
      setEditPointNames(snap.names);
      setEditPointDescriptions(snap.descriptions);
      setEditPointExpanded(snap.expanded);
      return h.slice(0, -1);
    });
  }, []);

  const setEditPointIcon = useCallback((idx: number, val: string) => {
    setEditPointIcons((prev) => prev.map((w, i) => i === idx ? val : w));
  }, []);

  const setEditPointDeviceType = useCallback((idx: number, val: string) => {
    setEditPointDeviceTypes((prev) => prev.map((v, i) => i === idx ? val : v));
  }, []);

  const setEditPointName = useCallback((idx: number, val: string) => {
    setEditPointNames((prev) => prev.map((v, i) => i === idx ? val : v));
  }, []);

  const setEditPointDescription = useCallback((idx: number, val: string) => {
    setEditPointDescriptions((prev) => prev.map((v, i) => i === idx ? val : v));
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editName.trim()) { setSaveEditError('Route name is required.'); return; }
    if (editPoints.length < 2) { setSaveEditError('At least 2 points required.'); return; }
    setIsSavingEdit(true);
    setSaveEditError('');
    try {
      const points = editPoints.map((pt, i) => ({
        sequenceNumber:   i + 1,
        latitude:         pt[0],
        longitude:        pt[1],
        pointType:        getPointType(i, editPoints.length),
        pointIcon:        editPointIcons[i]         || null,
        deviceTypeUuid:   editPointDeviceTypes[i]  || null,
        pointName:        editPointNames[i]        || null,
        pointDescription: editPointDescriptions[i] || null,
      }));
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
      setEditPoints([]);
      setEditPointIcons([]);
      setEditPointDeviceTypes([]);
      setEditPointNames([]);
      setEditPointDescriptions([]);
      setEditPointExpanded([]);
      await loadApiData();
    } catch {
      setSaveEditError('Failed to save.');
    } finally {
      setIsSavingEdit(false);
    }
  }, [editName, editType, editColor, editThickness, editStatus, editParentUuid, editDescription, editPoints, editPointIcons, editPointDeviceTypes, editPointNames, editPointDescriptions, editRouteId, loadApiData]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setDrawPoints((prev) => [...prev, [lat, lng]]);
    setDrawPointIcons((prev) => [...prev, '']);
    setDrawPointDeviceTypes((prev) => [...prev, '']);
    setDrawPointNames((prev) => [...prev, '']);
    setDrawPointDescriptions((prev) => [...prev, '']);
    setDrawPointExpanded((prev) => [...prev.map(() => false), true]); // collapse all, expand new
  }, []);

  const startDraw = useCallback(() => {
    setEditMode(false);
    setEditRouteId('');
    setEditPoints([]);
    setEditPointIcons([]);
    setEditPointDeviceTypes([]);
    setEditPointNames([]);
    setEditPointDescriptions([]);
    setDrawMode(true);
    setDrawPoints([]);
    setDrawPointIcons([]);
    setDrawPointDeviceTypes([]);
    setDrawPointNames([]);
    setDrawPointDescriptions([]);
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
    setDrawPointIcons([]);
    setDrawPointDeviceTypes([]);
    setDrawPointNames([]);
    setDrawPointDescriptions([]);
    setDrawPointExpanded([]);
    setSaveError('');
  }, []);

  const undoLastPoint = useCallback(() => {
    setDrawPoints((prev) => prev.slice(0, -1));
    setDrawPointIcons((prev) => prev.slice(0, -1));
    setDrawPointDeviceTypes((prev) => prev.slice(0, -1));
    setDrawPointNames((prev) => prev.slice(0, -1));
    setDrawPointDescriptions((prev) => prev.slice(0, -1));
    setDrawPointExpanded((prev) => prev.slice(0, -1));
  }, []);

  const setPointIcon = useCallback((idx: number, val: string) => {
    setDrawPointIcons((prev) => prev.map((w, i) => i === idx ? val : w));
  }, []);

  const setPointDeviceType = useCallback((idx: number, val: string) => {
    setDrawPointDeviceTypes((prev) => prev.map((v, i) => i === idx ? val : v));
  }, []);

  const setPointName = useCallback((idx: number, val: string) => {
    setDrawPointNames((prev) => prev.map((v, i) => i === idx ? val : v));
  }, []);

  const setPointDescription = useCallback((idx: number, val: string) => {
    setDrawPointDescriptions((prev) => prev.map((v, i) => i === idx ? val : v));
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
      const points = drawPoints.map((pt, i) => ({
        sequenceNumber:   i + 1,
        latitude:         pt[0],
        longitude:        pt[1],
        pointType:        getPointType(i, drawPoints.length),
        pointIcon:        drawPointIcons[i]         || null,
        deviceTypeUuid:   drawPointDeviceTypes[i]  || null,
        pointName:        drawPointNames[i]        || null,
        pointDescription: drawPointDescriptions[i] || null,
      }));
      const payload: Record<string, any> = {
        name:          drawName.trim(),
        type:          drawType,
        routeColor:    drawColor,
        lineThickness: drawThickness,
        points,
      };
      if (drawParentUuid)      payload.parentRouteUuid = drawParentUuid;
      if (drawDescription.trim()) payload.description  = drawDescription.trim();

      const res = await createTenantRoute(payload);
      if (!res.success) { setSaveError((res as any).message || 'Failed to save route.'); return; }
      setDrawMode(false);
      setDrawPoints([]);
      setDrawPointIcons([]);
      setDrawPointDeviceTypes([]);
      setDrawPointNames([]);
      setDrawPointDescriptions([]);
      setDrawPointExpanded([]);
      await loadApiData();
    } catch {
      setSaveError('Failed to save route.');
    } finally {
      setIsSaving(false);
    }
  }, [drawName, drawType, drawColor, drawThickness, drawParentUuid, drawDescription, drawPoints, drawPointIcons, drawPointDeviceTypes, drawPointNames, drawPointDescriptions, loadApiData]);

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
            <li>Click the <strong>lock / info icon</strong> in your browser's address bar.</li>
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
                      <>
                        <span className={styles.routeToggleDot} />
                        Visible
                      </>
                    ) : (
                      <>
                        <span className={styles.routeToggleDot} />
                        Hidden
                      </>
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
                    <option key={c.id} value={String(c.attributes.numericId)}>{c.attributes.name}</option>
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
            focusPoints={focusRoutePoints}
          />
          {/* Edit mode panel */}
          {editMode && (
            <div className={styles.drawPanel}>
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

              {editPoints.length > 0 && (
                <div className={styles.drawPointsList}>
                  <div className={styles.drawPointsHeader}>
                    <span>Points</span>
                    <span className={styles.drawPointsCount}>{editPoints.length}</span>
                    {editHistory.length > 0 && (
                      <button className={styles.drawUndoInlineBtn} onClick={undoEditPoint} title="Undo last added point">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 7v6h6" /><path d="M3 13C5.33 9.33 8.5 7 12 7c4.42 0 8 3.58 8 8" />
                        </svg>
                        Undo
                      </button>
                    )}
                  </div>
                  <div className={styles.drawPointsScroll}>
                    {editPoints.map((pt, i) => {
                      const ptType = getPointType(i, editPoints.length);
                      const isExpanded = editPointExpanded[i] ?? false;
                      const hasData = !!(editPointIcons[i] || editPointDeviceTypes[i] || editPointNames[i]);
                      const w = editPointIcons[i] ? availableIcons.find(x => x.id === editPointIcons[i]) : null;
                      const dt = editPointDeviceTypes[i] ? deviceTypes.find(x => x.id === editPointDeviceTypes[i]) : null;
                      return (
                        <div key={i} className={styles.drawPointRow} data-type={ptType}>
                          {/* Always-visible row header */}
                          <div className={styles.drawPointMeta}>
                            <span className={styles.drawSeq}>{i + 1}</span>
                            <span className={`${styles.drawPtType} ${styles[`ptType_${ptType}`]}`}>{ptType}</span>
                            {editPointNames[i] ? (
                              <span className={styles.drawPointLabel}>{editPointNames[i]}</span>
                            ) : (
                              <span className={styles.drawCoords}>{pt[0].toFixed(4)}, {pt[1].toFixed(4)}</span>
                            )}
                            {/* Inline icon/dt previews when collapsed */}
                            {!isExpanded && w && (
                              <span className={styles.drawPointInlineIcon}>
                                {w.attributes.iconType === 'svg'
                                  ? <span dangerouslySetInnerHTML={{ __html: fitSvgInline(w.attributes.svgTemplate || '') }} style={{ display: 'flex', width: 14, height: 14 }} />
                                  : <img src={w.attributes.iconUrl || ''} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />}
                              </span>
                            )}
                            {!isExpanded && !w && dt && dt.attributes.iconFileType && (
                              <span className={styles.drawPointInlineIcon}>
                                {dt.attributes.iconFileType === 'svg'
                                  ? <span dangerouslySetInnerHTML={{ __html: fitSvgInline(dt.attributes.iconSvgTemplate || '') }} style={{ display: 'flex', width: 14, height: 14 }} />
                                  : <img src={dt.attributes.iconUrl || ''} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />}
                              </span>
                            )}
                            {hasData && !isExpanded && <span className={styles.drawPointDataDot} title="Has data" />}
                            <button className={styles.drawPointExpandBtn} onClick={() => toggleEditPointExpanded(i)} title={isExpanded ? 'Collapse' : 'Expand'}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.15s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                                <polyline points="6 9 12 15 18 9" />
                              </svg>
                            </button>
                            <button className={styles.drawPointDeleteBtn} onClick={() => setPendingDeleteIdx(i)} title="Remove point">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M18 6L6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          {/* Expandable details */}
                          {isExpanded && (
                            <div className={styles.drawPointDetails}>
                              <div className={styles.drawPointField}>
                                <span className={styles.drawPointFieldLabel}>Icon</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <DrawSearchableSelect options={iconOptions} value={editPointIcons[i] ?? ''} onChange={(val) => setEditPointIcon(i, val)} placeholder="No icon" searchPlaceholder="Search icons…" />
                                  </div>
                                  {w && (
                                    <span className={styles.drawPointIconPreview}>
                                      {w.attributes.iconType === 'svg'
                                        ? <span dangerouslySetInnerHTML={{ __html: fitSvgInline(w.attributes.svgTemplate || '') }} style={{ display: 'flex', width: 22, height: 22 }} />
                                        : <img src={w.attributes.iconUrl || ''} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className={styles.drawPointField}>
                                <span className={styles.drawPointFieldLabel}>Device Type</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <DrawSearchableSelect options={deviceTypeOptions} value={editPointDeviceTypes[i] ?? ''} onChange={(val) => setEditPointDeviceType(i, val)} placeholder="No device type" searchPlaceholder="Search types…" />
                                  </div>
                                  {dt && dt.attributes.iconFileType && (
                                    <span className={styles.drawPointIconPreview}>
                                      {dt.attributes.iconFileType === 'svg'
                                        ? <span dangerouslySetInnerHTML={{ __html: fitSvgInline(dt.attributes.iconSvgTemplate || '') }} style={{ display: 'flex', width: 22, height: 22 }} />
                                        : <img src={dt.attributes.iconUrl || ''} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className={styles.drawPointField}>
                                <span className={styles.drawPointFieldLabel}>Point Name</span>
                                <input type="text" className={styles.drawInput} placeholder="e.g. Junction Box A" value={editPointNames[i] ?? ''} onChange={(e) => setEditPointName(i, e.target.value)} />
                              </div>
                              <div className={styles.drawPointField}>
                                <span className={styles.drawPointFieldLabel}>Note</span>
                                <input type="text" className={styles.drawInput} placeholder="Optional note…" value={editPointDescriptions[i] ?? ''} onChange={(e) => setEditPointDescription(i, e.target.value)} />
                              </div>
                              <div className={styles.drawPointCoordRow}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {pt[0].toFixed(5)}, {pt[1].toFixed(5)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {saveEditError && <p className={styles.drawError}>{saveEditError}</p>}
              <div className={styles.drawActions}>
                <button className={styles.drawUndoBtn} onClick={cancelEdit}>Cancel</button>
                <button className={styles.drawSaveBtn} onClick={saveEdit} disabled={isSavingEdit || editPoints.length < 2}>
                  {isSavingEdit ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* Draw mode save panel */}
          {drawMode && (
            <div className={styles.drawPanel}>
              <div className={styles.drawPanelHeader}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 17L21 17M3 7l6 4 6-4 6 4" />
                </svg>
                <span>Drawing Route</span>
                <span className={styles.drawPointCount}>{drawPoints.length} pts</span>
              </div>
              <p className={styles.drawHint}>Click on the map to place route points.</p>

              {/* Route Name */}
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

              {/* Route Type */}
              <div className={styles.drawField}>
                <label>Type <span className={styles.req}>*</span></label>
                <DrawSearchableSelect
                  options={ROUTE_TYPE_OPTIONS}
                  value={drawType}
                  onChange={setDrawType}
                  searchPlaceholder="Search type…"
                />
              </div>

              {/* Parent Route */}
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

              {/* Color + Thickness */}
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

              {/* Description */}
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
                      const ptType = getPointType(i, drawPoints.length);
                      const isExpanded = drawPointExpanded[i] ?? false;
                      const hasData = !!(drawPointIcons[i] || drawPointDeviceTypes[i] || drawPointNames[i]);
                      const w = drawPointIcons[i] ? availableIcons.find(x => x.id === drawPointIcons[i]) : null;
                      const dt = drawPointDeviceTypes[i] ? deviceTypes.find(x => x.id === drawPointDeviceTypes[i]) : null;
                      return (
                        <div key={i} className={styles.drawPointRow} data-type={ptType}>
                          {/* Always-visible row header */}
                          <div className={styles.drawPointMeta}>
                            <span className={styles.drawSeq}>{i + 1}</span>
                            <span className={`${styles.drawPtType} ${styles[`ptType_${ptType}`]}`}>{ptType}</span>
                            {drawPointNames[i] ? (
                              <span className={styles.drawPointLabel}>{drawPointNames[i]}</span>
                            ) : (
                              <span className={styles.drawCoords}>{pt[0].toFixed(4)}, {pt[1].toFixed(4)}</span>
                            )}
                            {/* Inline icon/dt previews when collapsed */}
                            {!isExpanded && w && (
                              <span className={styles.drawPointInlineIcon}>
                                {w.attributes.iconType === 'svg'
                                  ? <span dangerouslySetInnerHTML={{ __html: fitSvgInline(w.attributes.svgTemplate || '') }} style={{ display: 'flex', width: 14, height: 14 }} />
                                  : <img src={w.attributes.iconUrl || ''} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />}
                              </span>
                            )}
                            {!isExpanded && !w && dt && dt.attributes.iconFileType && (
                              <span className={styles.drawPointInlineIcon}>
                                {dt.attributes.iconFileType === 'svg'
                                  ? <span dangerouslySetInnerHTML={{ __html: fitSvgInline(dt.attributes.iconSvgTemplate || '') }} style={{ display: 'flex', width: 14, height: 14 }} />
                                  : <img src={dt.attributes.iconUrl || ''} alt="" style={{ width: 14, height: 14, objectFit: 'contain' }} />}
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
                          {isExpanded && (
                            <div className={styles.drawPointDetails}>
                              <div className={styles.drawPointField}>
                                <span className={styles.drawPointFieldLabel}>Icon</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <DrawSearchableSelect options={iconOptions} value={drawPointIcons[i] ?? ''} onChange={(val) => setPointIcon(i, val)} placeholder="No icon" searchPlaceholder="Search icons…" />
                                  </div>
                                  {w && (
                                    <span className={styles.drawPointIconPreview}>
                                      {w.attributes.iconType === 'svg'
                                        ? <span dangerouslySetInnerHTML={{ __html: fitSvgInline(w.attributes.svgTemplate || '') }} style={{ display: 'flex', width: 22, height: 22 }} />
                                        : <img src={w.attributes.iconUrl || ''} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className={styles.drawPointField}>
                                <span className={styles.drawPointFieldLabel}>Device Type</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <DrawSearchableSelect options={deviceTypeOptions} value={drawPointDeviceTypes[i] ?? ''} onChange={(val) => setPointDeviceType(i, val)} placeholder="No device type" searchPlaceholder="Search types…" />
                                  </div>
                                  {dt && dt.attributes.iconFileType && (
                                    <span className={styles.drawPointIconPreview}>
                                      {dt.attributes.iconFileType === 'svg'
                                        ? <span dangerouslySetInnerHTML={{ __html: fitSvgInline(dt.attributes.iconSvgTemplate || '') }} style={{ display: 'flex', width: 22, height: 22 }} />
                                        : <img src={dt.attributes.iconUrl || ''} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className={styles.drawPointField}>
                                <span className={styles.drawPointFieldLabel}>Point Name</span>
                                <input type="text" className={styles.drawInput} placeholder="e.g. Junction Box A" value={drawPointNames[i] ?? ''} onChange={(e) => setPointName(i, e.target.value)} />
                              </div>
                              <div className={styles.drawPointField}>
                                <span className={styles.drawPointFieldLabel}>Note</span>
                                <input type="text" className={styles.drawInput} placeholder="Optional note…" value={drawPointDescriptions[i] ?? ''} onChange={(e) => setPointDescription(i, e.target.value)} />
                              </div>
                              <div className={styles.drawPointCoordRow}>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                {pt[0].toFixed(5)}, {pt[1].toFixed(5)}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
          )}
        </div>
      </div>

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
