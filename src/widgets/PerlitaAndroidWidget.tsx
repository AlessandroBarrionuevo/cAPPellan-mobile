import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { Perlita } from '../types/bible';

export interface PerlitaAndroidWidgetProps {
  perlita: Perlita;
  isRandom?: boolean;
}

/**
 * Native Android Home Screen Widget for the Daily Perlita (RemoteViews via JSX).
 */
export function PerlitaAndroidWidget({
  perlita,
  isRandom = false,
}: PerlitaAndroidWidgetProps) {
  const verseText =
    perlita?.text ||
    'Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque el Señor tu Dios estará contigo en cada servicio, patrulla y misión.';
  const referenceText = perlita?.reference || 'Josué 1:9';
  const attributionText =
    perlita?.attribution || perlita?.theme || 'Capellanía · Guardia Activa';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1E3A5F',
        backgroundGradient: {
          from: '#0B192C',
          to: '#162942',
          orientation: 'TL_BR',
        },
      }}
      accessibilityLabel="Widget de Perlita del Día de CapellanAPP"
    >
      {/* Top Header Row: Badge + Refresh Action */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 4,
        }}
      >
        <FlexWidget
          clickAction="OPEN_APP"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#1E3A5F',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
          }}
        >
          <TextWidget
            text={isRandom ? '✦ PERLITA DE GUARDIA' : '✦ PERLITA DEL DÍA'}
            style={{
              fontSize: 10,
              fontWeight: 'bold',
              color: '#38BDF8',
              letterSpacing: 0.4,
            }}
          />
        </FlexWidget>

        <FlexWidget
          clickAction="REFRESH_PERLITA"
          accessibilityLabel="Cambiar por otra perlita"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#1E293B',
            paddingHorizontal: 9,
            paddingVertical: 3,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#334155',
          }}
        >
          <TextWidget
            text="↻ Otra"
            style={{
              fontSize: 10,
              fontWeight: 'bold',
              color: '#E2E8F0',
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Center Quote Body (Opens App on tap) */}
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          width: 'match_parent',
          flex: 1,
          justifyContent: 'center',
          paddingVertical: 4,
        }}
      >
        <TextWidget
          text={`“${verseText}”`}
          maxLines={4}
          truncate="END"
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: '#F8FAFC',
          }}
        />
      </FlexWidget>

      {/* Bottom Footer Row: Scripture Reference + Attribution */}
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: '#1E3A5F',
        }}
      >
        <TextWidget
          text={referenceText}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: 11,
            fontWeight: 'bold',
            color: '#F59E0B',
          }}
        />
        <TextWidget
          text={attributionText}
          maxLines={1}
          truncate="END"
          style={{
            fontSize: 10,
            color: '#94A3B8',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
