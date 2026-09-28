import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { Theme, globalStyles } from '../theme/Theme';
import {
  TacticalCard,
  TacticalButton,
  InstitutionalEmblem,
} from '../components/common';
import {
  HeartHandshake,
  Headphones,
  ChevronRight,
  ShieldCheck,
  Headset,
  FileCheck,
  ArrowRight,
  BookOpen,
} from 'lucide-react-native';

interface HubScreenProps {
  onNavigateToPrayers: () => void;
  onNavigateToContent: () => void;
  onNavigateToBlogs?: () => void;
  onNavigateToBible?: () => void;
  onContactChaplain?: () => void;
}

export default function HubScreen({
  onNavigateToPrayers,
  onNavigateToContent,
  onNavigateToBlogs,
  onContactChaplain,
}: HubScreenProps) {
  const { width } = useWindowDimensions();

  const handleSecrecyDetails = () => {
    Alert.alert(
      'Compromiso de Secreto Pastoral',
      'De acuerdo con las normativas canónicas y el Estatuto Institucional Art. 34-B, toda conversación, intercesión o petición queda bajo inviolabilidad ministerial absoluta.',
      [{ text: 'Entendido' }]
    );
  };

  const isTablet = width > 500;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        isTablet && styles.tabletContent,
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Cabecera Institucional Sobria */}
      <View style={styles.headerSection}>
        <View style={styles.emblemWrapper}>
          <InstitutionalEmblem size={48} />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.headerBadge}>CAPELLANÍA & COMUNIDAD</Text>
          <Text style={styles.headerTitle}>Comunidad y Recursos</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Espacios seguros de fraternidad, vigilia y templanza
          </Text>
        </View>
      </View>

      {/* 2. Estado de Guardia Pastoral Activa */}
      <View style={styles.statusPill}>
        <View style={styles.greenDotRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusPillText}>GUARDIA PASTORAL ACTIVA</Text>
        </View>
        <ShieldCheck size={14} color={Theme.colors.secondary} />
      </View>

      {/* 3. Destinos Clave de Elección Primaria */}
      <View style={styles.primaryDestinations}>
        {/* Destination 1: Muro de Oración */}
        <TacticalCard style={styles.destCard} padding={16}>
          <View style={styles.destTagRow}>
            <View style={styles.destTag}>
              <Text style={styles.destTagText}>COMUNIDAD & VIGILIA</Text>
            </View>
            <HeartHandshake size={20} color={Theme.colors.tacticalNavy} />
          </View>

          <Text style={styles.destTitle}>Muro de Oración y Cobertura</Text>
          <Text style={styles.destDesc}>
            Peticiones de intercesión reservadas entre personal militar, veteranos y familias de servicio. Sostén espiritual mutuo en el frente y retaguardia. Se pueden realizar peticiones anónimas.
          </Text>

          <TacticalButton
            title="Entrar al Muro"
            onPress={onNavigateToPrayers}
            variant="primary"
            size="md"
            rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
            style={styles.destActionBtn}
          />
        </TacticalCard>

        {/* Destination 2: Contenido y Mensajes de Valor */}
        <TacticalCard style={styles.destCard} padding={16}>
          <View style={styles.destTagRow}>
            <View style={styles.destTag}>
              <Text style={styles.destTagText}>MULTIMEDIA & FORMACIÓN</Text>
            </View>
            <Headphones size={20} color={Theme.colors.tacticalNavy} />
          </View>

          <Text style={styles.destTitle}>Contenido y Mensajes de Valor</Text>
          <Text style={styles.destDesc}>
            Podcasts de guardia, reflexiones de capellanes veteranos, homilías tácticas y meditaciones guiadas para el descanso y la templanza interior.
          </Text>

          <TacticalButton
            title="Ver Contenido"
            onPress={onNavigateToContent}
            variant="primary"
            size="md"
            rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
            style={styles.destActionBtn}
          />
        </TacticalCard>

        {/* Destination 3: Crónicas y Blogs de Servicio */}
        <TacticalCard style={styles.destCard} padding={16}>
          <View style={styles.destTagRow}>
            <View style={styles.destTag}>
              <Text style={styles.destTagText}>TESTIMONIOS & CRÓNICAS</Text>
            </View>
            <BookOpen size={20} color={Theme.colors.tacticalNavy} />
          </View>

          <Text style={styles.destTitle}>Crónicas y Blogs de Servicio</Text>
          <Text style={styles.destDesc}>
            Experiencias de combate, reflexiones de vigilia, descargos y testimonios compartidos por camaradas de armas y capellanes. No anónimo, con interacción fraterna y comentarios.
          </Text>

          <TacticalButton
            title="Leer Crónicas"
            onPress={onNavigateToBlogs || onNavigateToContent}
            variant="primary"
            size="md"
            rightIcon={<ArrowRight size={16} color="#FFFFFF" />}
            style={styles.destActionBtn}
          />
        </TacticalCard>
      </View>

      {/* 4. Accesos Secundarios de Acompañamiento */}
      <View style={styles.secondarySection}>
        <Text style={styles.secondarySectionTitle}>SERVICIOS AUXILIARES</Text>

        <TacticalCard style={styles.secondaryListCard} padding={0}>
          <TouchableOpacity
            style={styles.secondaryItem}
            onPress={onContactChaplain}
            activeOpacity={0.7}
          >
            <View style={styles.secondaryItemLeft}>
              <View style={styles.secondaryIconWrapper}>
                <Headset size={18} color={Theme.colors.secondary} />
              </View>
              <View style={styles.secondaryTextWrapper}>
                <Text style={styles.secondaryItemTitle}>
                  Asistencia y Guía de Guardia 24/7
                </Text>
                <Text style={styles.secondaryItemSub}>
                  Atención directa con capellán en servicio permanente
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={Theme.colors.secondary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.secondaryItem}
            onPress={handleSecrecyDetails}
            activeOpacity={0.7}
          >
            <View style={styles.secondaryItemLeft}>
              <View style={styles.secondaryIconWrapper}>
                <FileCheck size={18} color={Theme.colors.secondary} />
              </View>
              <View style={styles.secondaryTextWrapper}>
                <Text style={styles.secondaryItemTitle}>
                  Compromiso de Secreto Pastoral
                </Text>
                <Text style={styles.secondaryItemSub}>
                  Inviolabilidad de confesión y amparo deontológico
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={Theme.colors.secondary} />
          </TouchableOpacity>
        </TacticalCard>
      </View>

      {/* 5. Banner Institucional de Garantía y Amparo */}
      <TacticalCard style={styles.guaranteeBanner} variant="high" padding={14}>
        <View style={styles.guaranteeRow}>
          <ShieldCheck size={22} color={Theme.colors.secondary} style={{ marginTop: 2 }} />
          <View style={styles.guaranteeCol}>
            <Text style={styles.guaranteeTitle}>Garantía Inviolable</Text>
            <Text style={styles.guaranteeText}>
              Toda consulta, petición de plegaria o contacto dentro de este módulo goza de estricto fuero sacerdotal y secreto institucional incondicional.
            </Text>
          </View>
        </View>
      </TacticalCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.containerPadding,
    paddingTop: 16,
    paddingBottom: 120,
  },
  tabletContent: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  emblemWrapper: {
    width: 56,
    height: 56,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...globalStyles.shadowSm,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  headerBadge: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.secondary,
  },
  headerTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 20,
    color: Theme.colors.onSurface,
  },
  headerSubtitle: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Theme.roundness.lg,
    marginBottom: 16,
    ...globalStyles.shadowSm,
  },
  greenDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusPillText: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
  },
  primaryDestinations: {
    gap: 14,
    marginBottom: 20,
  },
  destCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  destTagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  destTag: {
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  destTagText: {
    ...globalStyles.labelCaps,
    fontSize: 9,
    color: Theme.colors.secondary,
  },
  destTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  destDesc: {
    ...globalStyles.bodySm,
    fontSize: 12,
    lineHeight: 18,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 14,
  },
  destActionBtn: {
    alignSelf: 'flex-start',
    width: 'auto',
    paddingHorizontal: 20,
  },
  secondarySection: {
    marginBottom: 16,
  },
  secondarySectionTitle: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.secondary,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  secondaryListCard: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
  },
  secondaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  secondaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  secondaryIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Theme.roundness.md,
    backgroundColor: Theme.colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  secondaryTextWrapper: {
    flex: 1,
  },
  secondaryItemTitle: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  secondaryItemSub: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F2F5',
    marginLeft: 62,
  },
  guaranteeBanner: {
    marginBottom: 10,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  guaranteeCol: {
    flex: 1,
  },
  guaranteeTitle: {
    ...globalStyles.labelCaps,
    fontSize: 10,
    color: Theme.colors.secondary,
    marginBottom: 2,
  },
  guaranteeText: {
    ...globalStyles.bodySm,
    fontSize: 11,
    lineHeight: 16,
    color: Theme.colors.onSurface,
  },
});
