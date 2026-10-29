import React from 'react';
import {
  FlexWidget,
  TextWidget,
} from 'react-native-android-widget';
import type { Perlita } from '../types/bible';

export interface PerlitaAndroidWidgetProps {
  perlita: Perlita;
  isRandom?: boolean;
}

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function formatWidgetDate(dateStr?: string): string {
  if (dateStr && dateStr.trim().length > 0) {
    return dateStr;
  }
  const now = new Date();
  return `${MONTHS_ES[now.getMonth()]}, ${now.getDate()}`;
}

/**
 * Native Android Home Screen Widget for the Daily Perlita.
 * Clean, lightweight layout without dummy counters or overlapping click captures.
 * Header features an isolated, direct '↻ Otro' refresh trigger.
 */
export function PerlitaAndroidWidget({
  perlita,
  isRandom = false,
}: PerlitaAndroidWidgetProps) {
  const verseText =
    perlita?.text ||
    'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque el Señor tu Dios estará contigo en cada servicio, patrulla y misión.';
  const referenceText = perlita?.reference || 'Josué 1:9';
  const displayDate = formatWidgetDate(perlita?.date);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#CBD5E1',
        backgroundColor: '#FFFFFF',
      }}
      accessibilityLabel="Widget de Perlita del Día de CapellanAPP"
    >
      {/* 1. Header Bar: Tactical Blue #0c7ae0 with isolated Refresh Action */}
      <FlexWidget
        style={{
          width: 'match_parent',
          height: 32,
          backgroundColor: '#0c7ae0',
          borderTopLeftRadius: 15,
          borderTopRightRadius: 15,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 12,
        }}
      >
        <FlexWidget
          clickAction="OPEN_APP"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 4,
          }}
        >
          <TextWidget
            text={isRandom ? '✦ PERLITA DE GUARDIA' : '✦ PERLITA DEL DÍA'}
            style={{
              fontSize: 10.5,
              fontWeight: 'bold',
              color: '#FFFFFF',
              letterSpacing: 0.8,
            }}
          />
        </FlexWidget>

        {/* Dedicated, isolated refresh button without parent overlay conflict */}
        <FlexWidget
          clickAction="REFRESH_PERLITA"
          accessibilityLabel="Cambiar por otro versículo"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.28)',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 7,
          }}
        >
          <TextWidget
            text="↻ Otro"
            clickAction="REFRESH_PERLITA"
            style={{
              fontSize: 10.5,
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* 2. Main Quote Body (Opens App on Tap) */}
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          width: 'match_parent',
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          paddingHorizontal: 14,
          paddingVertical: 6,
        }}
      >
        <TextWidget
          text={`“${verseText}”`}
          maxLines={3}
          truncate="END"
          style={{
            fontSize: 12.5,
            fontWeight: 'bold',
            color: '#0F2438',
            lineSpacingExtra: 1,
          }}
        />
      </FlexWidget>

      {/* 3. Footer Row: Scripture Reference & Date ONLY (No dummy icons) */}
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingBottom: 8,
          paddingTop: 4,
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
        }}
      >
        <TextWidget
          text={`— ${referenceText}`}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: 11,
            fontWeight: 'bold',
            color: '#0c7ae0',
          }}
        />

        <TextWidget
          text={displayDate}
          style={{
            fontSize: 10.5,
            color: '#64748B',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
