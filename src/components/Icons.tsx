import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// 地震アイコン（波形・震動）
export const EarthquakeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <polyline points="2 12 6 12 9 3 13 21 16 10 18 14 22 12" />
  </svg>
);

// 津波・海洋アイコン（大波）
export const TsunamiIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="none" />
    <path d="M2 13c1.5-1 3-1.5 4.5-1.5 2 0 3.5 1 5.5 1 2 0 3.5-1 5-2 1.5 2 3.5 2.5 5 2.5v2c-2 0-4-1-6-2.5-1.5 1-3 1.5-4.5 1.5-2 0-3.5-1-5.5-1-1.5 0-2.8.4-4 1V13zm0-5c1.5-1 3-1.5 4.5-1.5 2.5 0 4 1.5 6 3 1.5-1 3-1.5 4.5-1.5 2 0 3.5 1 5 1V8c-1.5 0-3-.5-4.5-1.5-2-1.3-4-2.5-6.5-2.5-2 0-3.5.7-5 1.8-1.3-1-2.6-1.3-4-1.3v2c1 0 2 .3 3 1-1.2.7-2.3 1-3.5 1V8z" />
  </svg>
);

// 気象アイコン（雲）
export const WeatherIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
  </svg>
);

// 避難場所アイコン（マップピン・走る人）
export const ShelterIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

// ハザードマップアイコン（レイヤー階層）
export const HazardMapIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9.07l-9-7-9 7 1.63 1.2L12 16zM12 2L4 8l8 6 8-6-8-6z" />
  </svg>
);

// チェックリストアイコン（クリップボードチェック）
export const ChecklistIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

// 行動マニュアルアイコン（本・ガイド）
export const ManualIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
  </svg>
);

// 家族連絡アイコン（家族・人々）
export const FamilyIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={size ? { width: size, height: size } : undefined}
  >
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

// 飲料水アイコン（水滴）
export const WaterIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

// 非常食アイコン（ボウル/食事）
export const FoodIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.48l1.64-14.01H1a.5.5 0 0 0-.5.5v.5c0 6.63 5.37 12 12 12 .86 0 1.7-.09 2.52-.26l1.24 2.75h1.8zm-5.06-4.5c-4.97 0-9-4.03-9-9h18c0 4.97-4.03 9-9 9zM1 4h22v2H1z" />
  </svg>
);

// トイレアイコン
export const ToiletIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M9 22h6v-2H9v2zm8-18H7v2h10V4zm-1 4H8c-1.1 0-2 .9-2 2v6c0 2.21 1.79 4 4 4h4c2.21 0 4-1.79 4-4v-6c0-1.1-.9-2-2-2zm0 8c0 1.1-.9 2-2 2h-4c-1.1 0-2-.9-2-2v-4h8v4z" />
  </svg>
);

// ガスボンベ・火気アイコン
export const GasIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM12 20c-3.31 0-6-2.69-6-6 0-1.53.58-3.04 1.59-4.2.14.77.6 1.48 1.33 1.95.89.58 2.03.67 3.03.25.17.63.49 1.23.94 1.72 1.33 1.45 2.11 3.12 1.11 5.28-.62.63-1.28 1-2 1z" />
  </svg>
);

// 保存アイコン
export const SaveIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" />
  </svg>
);

// QRコードアイコン
export const QrIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3 3h8v8H3zm2 2v4h4V5zm8-2h8v8h-8zm2 2v4h4V5zM3 13h8v8H3zm2 2v4h4v-4zm13-2h3v2h-3zm-5 0h3v2h-3zm0 3h3v2h-3zm2 3h3v2h-3zm3 0h3v2h-3zm0-3h3v2h-3z" />
  </svg>
);

// コピーアイコン
export const CopyIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
  </svg>
);

// チャット・メッセージアイコン
export const ChatIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
  </svg>
);

// 火災アイコン
export const FireIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.399 8.169-7.333-3.856-7.333 3.856 1.399-8.169-5.934-5.784 8.2-1.192zm0 5.702l-2.22 4.498-4.964.721 3.592 3.501-.847 4.945 4.439-2.334 4.439 2.334-.847-4.945 3.592-3.501-4.964-.721z" fill="none" />
    <path d="M19.48 12.35c-1.57-4.08-7.16-4.3-5.81-10.23C8.6 3.86 4 9.17 4 14.5c0 4.42 3.58 8 8 8s8-3.58 8-8c0-.73-.08-1.44-.22-2.15h-.3zM12 20.5c-3.31 0-6-2.69-6-6 0-2.9 1.94-5.65 4.22-7.13-.37 2.45.67 4.8 2.58 6.09 1.55 1.05 2.5 2.76 2.5 4.54 0 1.38-.89 2.5-3.3 2.5z" />
  </svg>
);

// 降雨・水害アイコン
export const RainIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3zm-6 2h-2v2h2v-2zm-4 0H7v2h2v-2zm8 0h-2v2h2v-2z" />
  </svg>
);

// マップピン・現在地アイコン（📍）
export const LocationPinIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
);

// 電話・連絡先アイコン（📞）
export const PhoneCallIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
  </svg>
);

// 自宅アイコン（🏠）
export const HomeIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

// メモ・特記事項アイコン（📝）
export const MemoIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);

// 学校施設アイコン（🏫 小・中学校：三角屋根・時計塔・教室窓のある校舎建築）
export const SchoolIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2l-3 2.5V6H4c-.55 0-1 .45-1 1v14h7v-4h4v4h7V7c0-.55-.45-1-1-1h-5V4.5L12 2zm0 4.2a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6zM6 9h3v2.5H6V9zm9 0h3v2.5h-3V9zm-9 4.5h3V16H6v-2.5zm9 0h3V16h-3v-2.5z" />
  </svg>
);

// 公民館・コミュニティ施設アイコン（🏛️ 公民館・地域センター：公共交流ホール・エントランス柱）
export const CommunityIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2L2 7v2h20V7L12 2zm-8 8v8h3v-8H4zm6 0v5h4v-5h-4zm7 0v8h3v-8h-3zm-9 7v2h8v-2H8zm-6 3h20v-2H2v2z" />
  </svg>
);

// 体育館・スポーツセンターアイコン（🏟️ 体育館：アーチ型ドーム屋根と大アリーナ建築）
export const GymIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 3C6.5 3 2.5 5.8 2 8v12c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V8c-.5-2.2-4.5-5-10-5zm0 2c4.6 0 7.6 2 7.9 3.5V10H4.1V8.5C4.4 7 7.4 5 12 5zm-8 7h16v7h-5v-5H9v5H4v-7zm7 2h2v3h-2v-3z" />
  </svg>
);

// 公園・広場アイコン（🌳 広域避難場所：豊かな大樹と避難広場・大地）
export const ParkIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C9.24 2 7 4.24 7 7c0 .43.06.84.16 1.23C5.35 8.76 4 10.47 4 12.5 4 14.99 6.01 17 8.5 17H11v4H8v2h8v-2h-3v-4h2.5c2.49 0 4.5-2.01 4.5-4.5 0-2.03-1.35-3.74-3.16-4.27.1-.39.16-.8.16-1.23 0-2.76-2.24-5-5-5zm-8 19h16v1.5H4V21z" />
  </svg>
);

// 津波避難ビルアイコン（🌊 津波避難ビル：高層RC建物と迫る津波大波・上方退避）
export const TsunamiBuildingIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13 2h8c.55 0 1 .45 1 1v18h-9V2zm2 3h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2zm3-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z" />
    <path d="M1 21h10v-2c-2.5 0-4.8-.8-6.2-2.5 1.8 0 3.3-.6 4.4-1.7 1.3-1.3 1.8-3 1.8-4.8-2.2.2-4 1.3-5 3-.1-1.3.2-2.6 1-3.8C4.5 9.4 3 11.5 2.5 14c-.6 2.2-.3 4.8.5 7H1v0z" />
  </svg>
);

// 電球・チェックポイントアイコン（💡）
export const LightbulbIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm2.85 11.1l-.85.6V16h-4v-1.3l-.85-.6A4.997 4.997 0 0 1 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.63-.8 3.16-2.15 4.1z" />
  </svg>
);

// 虫眼鏡・検索アイコン（🔍）
export const SearchIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

// 徒歩ルートアイコン（🚶）
export const WalkIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" />
  </svg>
);

// 地図展開アイコン（🗺️）
export const MapFoldIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />
  </svg>
);

// お知らせ・インフォメーションアイコン（ℹ️）
export const InfoIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
  </svg>
);

// 更新・再読み込みアイコン（🔄）
export const RefreshIcon: React.FC<IconProps> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
  </svg>
);

// チェックマークアイコン（✅）
export const CheckCircleIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

// 警告三角アイコン（⚠️）
export const WarningIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

// メガホン・告知アイコン（📢）
export const MegaphoneIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z" />
  </svg>
);



