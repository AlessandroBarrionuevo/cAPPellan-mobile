import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Share,
} from 'react-native';
import { PerlitaWidget } from './PerlitaWidget';
import { PrayerWallWidget } from './PrayerWallWidget';
import { ContentFeaturedWidget } from './ContentFeaturedWidget';
import { ChaplainRosterWidget } from './ChaplainRosterWidget';
import { ConfidentialityBanner } from '../common';
import { ContentCommentsModal } from '../content/ContentCommentsModal';
import CallIntakeModal from '../duty/CallIntakeModal';
import NoChaplainAvailableModal from '../duty/NoChaplainAvailableModal';
import { getPerlitaDelDia, getRandomPerlita } from '../../lib/api/bible';
import { getDeterministicForcePerlita, getRandomForcePerlita } from '../../data/perlitasData';
import type { Perlita } from '../../types/bible';
import { getChaplainTeam } from '../../lib/api/profiles';
import { fetchContents, toggleContentLike } from '../../lib/api/content';
import { request } from '../../lib/api/client';
import { ENDPOINTS } from '../../lib/api/endpoints';
import { useCallStore } from '../../lib/stores/call';
import type {
  ContentItem,
  ChaplainTeamMember,
  CallIntake,
  SessionType,
} from '../../types/api';
import type { Prayer, PaginatedPrayersResponse } from '../../types/prayer';
import type { Gratitude } from '../../types/gratitude';
import { getGratitudes, thankGratitude } from '../../lib/api/gratitudes';

const FALLBACK_DASHBOARD_PRAYERS: Prayer[] = [
  {
    id: 101,
    title: 'Personal en Frontera Norte',
    description: 'Pedimos cobertura, fortaleza espiritual y protección para los efectivos en patrulla y sus familias.',
    content: ['Personal en despliegue operativo', 'Protección y paz en el hogar'],
    authorName: 'Oficial Reservado',
    isAnonymous: true,
    prayerCount: 84,
    commentCount: 16,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 102,
    title: 'Sanidad y Recuperación Médica',
    description: 'Por pronta restauración física y moral de los camaradas heridos en cumplimiento del deber.',
    content: ['Salud y bienestar integral', 'Sostén moral a sus seres queridos'],
    authorName: 'Suboficial R. Gómez',
    isAnonymous: false,
    prayerCount: 42,
    commentCount: 11,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 103,
    title: 'Paz y Templanza en Guardia',
    description: 'Por sabiduría, discernimiento y serenidad para todos los camaradas de turno este fin de semana.',
    content: ['Serenidad en el servicio', 'Fortaleza moral'],
    authorName: 'Camarada en Servicio',
    isAnonymous: true,
    prayerCount: 19,
    commentCount: 4,
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
];

const FALLBACK_DASHBOARD_GRATITUDES: Gratitude[] = [
  {
    id: 301,
    title: 'Recuperación favorable tras intervención',
    description: 'Doy gracias a Dios y a los camaradas que oraron por mi hijo; la cirugía fue un éxito total y ya está en sala común.',
    content: ['Operación exitosa', 'Acompañamiento pastoral recibido'],
    authorName: 'Suboficial Rivas',
    isAnonymous: false,
    gratitudeCount: 34,
    prayerCount: 34,
    commentCount: 9,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 302,
    title: 'Retorno seguro tras misión de rescate',
    description: 'Agradecidos por la protección divina sobre toda la brigada durante las intensas tormentas en alta montaña.',
    content: ['Brigada completa y sin novedad', 'Paz en los hogares'],
    authorName: 'Oficial Reservado',
    isAnonymous: true,
    gratitudeCount: 51,
    prayerCount: 51,
    commentCount: 15,
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
  },
  {
    id: 303,
    title: 'Provisión y nuevo destino alcanzado',
    description: 'Dios abrió una puerta excelente de vivienda cerca del nuevo destacamento. Bendito sea el Señor por su fidelidad.',
    content: ['Familia unida y reubicada', 'Gratitud a la comunidad'],
    authorName: 'Cabo 1ro Fernández',
    isAnonymous: false,
    gratitudeCount: 22,
    prayerCount: 22,
    commentCount: 5,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

const FALLBACK_DASHBOARD_CONTENTS: ContentItem[] = [
  {
    id: 201,
    title: 'Episodio 14: Fortaleza y Resiliencia en el Deber',
    description: 'Reflexión pastoral sobre la templanza espiritual en situaciones de alta presión y el valor de la fe en el servicio.',
    mediaUrl: 'https://open.spotify.com/episode/3ZcyXfVn2e5h1p6z8Q1v9m',
    type: 'SPOTIFY',
    authorId: 1,
    likesCount: 58,
    commentsCount: 14,
    isLikedByMe: false,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 202,
    title: 'La Bendición: Oración de Protección y Cobertura',
    description: '«El Señor te bendiga y te guarde; haga resplandecer su rostro sobre ti.» Oración y bendición sacerdotal para las fuerzas y sus hogares.',
    mediaUrl: 'https://www.youtube.com/watch?v=n4El75Bi-1s',
    type: 'YOUTUBE',
    authorId: 2,
    likesCount: 142,
    commentsCount: 38,
    isLikedByMe: true,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 203,
    title: 'La Palabra como Refugio en la Guardia',
    description: '«No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo.» Isaías 41:10. La Escritura como brújula y consuelo.',
    mediaUrl: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&q=80&w=800',
    type: 'IMAGE',
    authorId: 3,
    likesCount: 95,
    commentsCount: 21,
    isLikedByMe: false,
    createdAt: new Date(Date.now() - 3600000 * 32).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 32).toISOString(),
  },
];

export interface SharedDashboardWidgetsProps {
  onNavigateToBible?: () => void;
  onNavigateToContent?: () => void;
  onNavigateToPrayers?: (initialTab?: 'prayer' | 'gratitude') => void;
  onNavigateToBlogs?: () => void;
  onJoinCall?: () => void;
  onJoinChat?: () => void;
  showRoster?: boolean;
}

export function SharedDashboardWidgets({
  onNavigateToBible,
  onNavigateToContent,
  onNavigateToPrayers,
  onJoinCall,
  onJoinChat,
  showRoster = true,
}: SharedDashboardWidgetsProps) {
  // 1. Perlita State
  const [perlita, setPerlita] = useState<Perlita | null>(null);
  const [isLoadingPerlita, setIsLoadingPerlita] = useState(false);
  const [isRandomPerlita, setIsRandomPerlita] = useState(false);

  // 2. Prayers & Gratitudes State
  const [prayersList, setPrayersList] = useState<Prayer[]>(FALLBACK_DASHBOARD_PRAYERS);
  const [isLoadingPrayers, setIsLoadingPrayers] = useState(false);
  const [prayedIds, setPrayedIds] = useState<Set<number>>(new Set());

  const [gratitudesList, setGratitudesList] = useState<Gratitude[]>(FALLBACK_DASHBOARD_GRATITUDES);
  const [isLoadingGratitudes, setIsLoadingGratitudes] = useState(false);
  const [thankedIds, setThankedIds] = useState<Set<number>>(new Set());

  // 3. Contents State
  const [contentList, setContentList] = useState<ContentItem[]>(FALLBACK_DASHBOARD_CONTENTS);
  const [isLoadingContents, setIsLoadingContents] = useState(false);
  const [activeContentForComments, setActiveContentForComments] = useState<ContentItem | null>(null);

  // 4. Chaplains State
  const [chaplainTeam, setChaplainTeam] = useState<ChaplainTeamMember[]>([]);

  // 5. Call intake state for roster actions
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [showNoChaplainModal, setShowNoChaplainModal] = useState(false);
  const [selectedType, setSelectedType] = useState<SessionType>('VIDEO');
  const requestCall = useCallStore((state) => state.requestCall);
  const resetCall = useCallStore((state) => state.resetCall);
  const callStatus = useCallStore((state) => state.callStatus);
  const error = useCallStore((state) => state.error);

  useEffect(() => {
    if (error && (error.includes('No hay capellanes') || error.includes('disponibles'))) {
      setShowNoChaplainModal(true);
    }
  }, [error]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingPerlita(true);

    getPerlitaDelDia()
      .then((data) => {
        if (isMounted) setPerlita(data || getDeterministicForcePerlita());
      })
      .catch((err) => {
        console.warn('Error loading daily perlita in shared widgets, using forces reflection:', err);
        if (isMounted) setPerlita(getDeterministicForcePerlita());
      })
      .finally(() => {
        if (isMounted) setIsLoadingPerlita(false);
      });

    if (showRoster) {
      getChaplainTeam()
        .then((team) => {
          if (isMounted && Array.isArray(team) && team.length > 0) {
            setChaplainTeam(team);
          }
        })
        .catch((err) => {
          console.warn('Error loading chaplain team in shared widgets:', err);
        });
    }

    setIsLoadingPrayers(true);
    request<PaginatedPrayersResponse>(`${ENDPOINTS.PRAYERS}?page=0&size=5`)
      .then((res) => {
        if (isMounted && res && Array.isArray(res.content) && res.content.length > 0) {
          setPrayersList(res.content.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn('Error loading prayers in shared widgets:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingPrayers(false);
      });

    setIsLoadingGratitudes(true);
    getGratitudes(0, 5)
      .then((res) => {
        if (isMounted && res && Array.isArray(res.content) && res.content.length > 0) {
          setGratitudesList(res.content.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn('Error loading gratitudes in shared widgets:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingGratitudes(false);
      });

    setIsLoadingContents(true);
    fetchContents()
      .then((items) => {
        if (isMounted && Array.isArray(items) && items.length > 0) {
          setContentList(items.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn('Error loading contents in shared widgets:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingContents(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showRoster]);

  // Perlita Handlers
  const handleRandomPerlita = async () => {
    try {
      setIsLoadingPerlita(true);
      const random = await getRandomPerlita();
      setPerlita(random || getRandomForcePerlita());
      setIsRandomPerlita(true);
    } catch {
      setPerlita(getRandomForcePerlita());
      setIsRandomPerlita(true);
    } finally {
      setIsLoadingPerlita(false);
    }
  };

  const handleSharePerlita = async () => {
    if (!perlita) return;
    try {
      await Share.share({
        title: 'Perlita Devocional - cAPPellan',
        message: `“${perlita.text}”\n— ${perlita.reference} (${perlita.translation || 'PDDPT'})\n${perlita.theme ? `Tema: ${perlita.theme}\n` : ''}\n${perlita.attribution ? `${perlita.attribution}\n\n` : ''}cAPPellan: Servicio y Acompañamiento Pastoral`,
      });
    } catch {
      // Ignored
    }
  };

  // Prayer & Gratitude Handlers
  const handlePray = async (prayerId: number) => {
    if (prayedIds.has(prayerId)) return;
    setPrayedIds((prev) => new Set(prev).add(prayerId));
    setPrayersList((prev) =>
      prev.map((p) => (p.id === prayerId ? { ...p, prayerCount: p.prayerCount + 1 } : p))
    );
    try {
      await request(ENDPOINTS.PRAYER_PRAY(prayerId), { method: 'POST' });
    } catch {
      // Ignored for optimistic responsiveness
    }
  };

  const handleThankGratitude = async (gratitudeId: number) => {
    if (thankedIds.has(gratitudeId)) return;
    setThankedIds((prev) => new Set(prev).add(gratitudeId));
    setGratitudesList((prev) =>
      prev.map((g) =>
        g.id === gratitudeId
          ? {
              ...g,
              gratitudeCount: (g.gratitudeCount ?? 0) + 1,
              prayerCount: (g.prayerCount ?? 0) + 1,
            }
          : g
      )
    );
    try {
      await thankGratitude(gratitudeId);
    } catch {
      // Ignored for optimistic responsiveness
    }
  };

  // Content Handlers
  const handleLikeContent = async (contentId: number) => {
    setContentList((prev) =>
      prev.map((item) => {
        if (item.id === contentId) {
          const nextLiked = !item.isLikedByMe;
          return {
            ...item,
            isLikedByMe: nextLiked,
            likesCount: nextLiked ? item.likesCount + 1 : Math.max(0, item.likesCount - 1),
          };
        }
        return item;
      })
    );

    try {
      const res = await toggleContentLike(contentId);
      setContentList((prev) =>
        prev.map((item) =>
          item.id === contentId
            ? { ...item, isLikedByMe: res.liked, likesCount: res.likesCount }
            : item
        )
      );
    } catch (err) {
      console.warn('[SharedDashboardWidgets] Failed to toggle like on content:', err);
    }
  };

  // Roster Handlers
  const handleSelectChat = () => {
    setSelectedType('CHAT');
    setShowIntakeModal(true);
  };

  const handleSelectCall = () => {
    setSelectedType('VIDEO');
    setShowIntakeModal(true);
  };

  const handleStartCall = async (type: SessionType, intake?: CallIntake) => {
    try {
      await requestCall(type, intake);
      // NOTE: Do not directly jump to onJoinChat/onJoinCall here.
      // requestCall sets callStatus to 'WAITING' in useCallStore.
      // BasicDashboardPreview renders the WAITING screen and transitions to
      // onJoinChat/onJoinCall once the chaplain accepts (IN_PROGRESS).
    } catch {
      // Error handled by store
    }
  };

  return (
    <View style={styles.widgetsContainer}>
      {/* 1. Daily Devotional: Perlita del Día */}
      <PerlitaWidget
        perlita={perlita}
        isLoading={isLoadingPerlita}
        isRandom={isRandomPerlita}
        onRandomPerlita={handleRandomPerlita}
        onSharePerlita={handleSharePerlita}
        onNavigateToBible={onNavigateToBible}
      />

      {/* 2. Community Intercession & Gratitude: Muro de Oración y Gratitud */}
      <PrayerWallWidget
        prayers={prayersList}
        gratitudes={gratitudesList}
        isLoading={isLoadingPrayers}
        isLoadingGratitudes={isLoadingGratitudes}
        prayedIds={prayedIds}
        thankedIds={thankedIds}
        onPray={handlePray}
        onThank={handleThankGratitude}
        onNavigateToPrayers={onNavigateToPrayers}
      />

      {/* 3. Multimedia & Reflections: Content Widget */}
      <ContentFeaturedWidget
        contents={contentList}
        isLoading={isLoadingContents}
        onLikeToggle={handleLikeContent}
        onOpenComments={setActiveContentForComments}
        onNavigateToContent={onNavigateToContent}
      />

      {/* 4. Direct Selection: Roster of Chaplains */}
      {showRoster && (
        <ChaplainRosterWidget
          chaplainTeam={chaplainTeam}
          onSelectChat={handleSelectChat}
          onSelectCall={handleSelectCall}
        />
      )}

      {/* 5. Confidentiality Protocol Banner */}
      <ConfidentialityBanner
        title="Secreto de Confesión & Sigilo Total"
        description="Protegido por normativa canónica, ética pastoral y estricta confidencialidad."
        style={styles.confidentialityBanner}
      />

      {/* Content Comments Modal */}
      <ContentCommentsModal
        visible={Boolean(activeContentForComments)}
        content={activeContentForComments}
        onClose={() => setActiveContentForComments(null)}
        onCommentAdded={(contentId, newCount) => {
          setContentList((prev) =>
            prev.map((c) => (c.id === contentId ? { ...c, commentsCount: newCount } : c))
          );
          if (activeContentForComments && activeContentForComments.id === contentId) {
            setActiveContentForComments((prev) =>
              prev ? { ...prev, commentsCount: newCount } : null
            );
          }
        }}
      />

      {/* Call Intake Modal */}
      <CallIntakeModal
        visible={showIntakeModal}
        sessionType={selectedType}
        onClose={() => setShowIntakeModal(false)}
        isSubmitting={callStatus === 'REQUESTING'}
        onSubmit={async (intake?: CallIntake) => {
          setShowIntakeModal(false);
          await handleStartCall(selectedType, intake);
        }}
      />

      {/* No Chaplains Available Support Modal */}
      <NoChaplainAvailableModal
        visible={showNoChaplainModal}
        onClose={() => {
          setShowNoChaplainModal(false);
          resetCall();
        }}
        onRetry={() => {
          setShowNoChaplainModal(false);
          resetCall();
          handleStartCall(selectedType);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  widgetsContainer: {
    gap: 16,
    width: '100%',
  },
  confidentialityBanner: {
    marginTop: 4,
    marginBottom: 8,
  },
});
