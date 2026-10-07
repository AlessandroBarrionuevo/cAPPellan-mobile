import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Theme, globalStyles } from '../../theme/Theme';
import { TacticalCard } from '../common';
import { MessageSquare, Video } from 'lucide-react-native';
import type { ChaplainTeamMember } from '../../types/api';

export const DEFAULT_FORCE_PORTRAIT =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDhgKUhM5FIC82K02jlklaDgenTWM2lcfpTpcZNQ8Nrq42tc4cWzkV3gj_W1L8uyQLrCvmck9lmaCgLXgdSUuVEvGcrlq6wWC4PKxWzDskWn9x2DBpPtSmPe7WUVVkwdeM4dEA4d92ySFhcRYmsAjBq-fLehNdLZ1aN1CjkFN0fvKjJOPPwjDfxxpUlg_Phvll2Mf6LHoUmTfZC5Y5qbvgvlE48uV4cQt3KjwzsUgfAYkZAbvhNh3iIbg';

const FALLBACK_CHAPLAIN_ROSTER = [
  {
    id: 1,
    name: 'Cap. Mayor Morales',
    branch: 'Ejército',
    specialty: 'Especialista en estrés operativo y retorno',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBqDZ2JpvNoZkWZF0odAe80kpx0qGWzdevv88xrvcS6dpIguNmVQbkNPw2LjQpPdMsgsA0rItqZg37YqDbkoiXFTqTu5eIaE8YiaCmRx6xaodA-G3wkW4Uvik6qGtzF5M1R4X34VbuUhjYGrHIlh1tLp_zoffvUwN6UwMtQzrkIUySkwdS7qTr3mE0_c6nEIhQ9V-9laJcB-UM5JhyE0ikuJHNQ7tQWo_KSvEynMAfvI4NFfiV29rWPRA',
  },
  {
    id: 2,
    name: 'Cap. Álvarez',
    branch: 'Gendarmería / Policía',
    specialty: 'Acompañamiento en incidentes críticos',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDqppq_I2-Lm4BfCj9e3SjR45iq5x2p7d61AHy9FGH494cOs8Ggqf-dz38wMU7fLnt1VJgtO9rfOmK8k9k9I_GbTBWWObLWnozWz_sxceQWKkxf6ysHPN7pGqcUY5Z2nN54FsXcB5A3ABrw4Xi4qMjWrjQi0GnvWuequ6qVpQolZyAZWM7kWC2qaP8s1M2KdlaANPx9_4CpUtXWjnUCeAaNbk8Im8CedKI5cKDiurLhAUavBL00hiMiqA',
  },
  {
    id: 3,
    name: 'Cap. Vázquez',
    branch: 'Familia & Duelo',
    specialty: 'Soporte a cónyuges, hijos y duelo moral',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCwTrmGIGeW9DPei-OLCIoPxfQTy3wXtOp9K1jOual8wWrK20eiZzoxkHgtpMaHim8YMUmzaSf7bOFJ5VsQegmLY48XNZ8EncX2D19vq0Wb5xpKiMTzdRnhhC3Oko0x2s2xBsII43Fyq_0eW-Gka9tQ_2mUO0qEIyaYk4Yvv0jw5A2J4g-qgjSe-hBNwnjWpRkGR9voUvYM8tFmZIvqr1usUb2qMbPTphkYykqghpb-RZOh3e1YJK62cQ',
  },
];

function resolveChaplainAvatar(item: any): string {
  if (item.avatarUrl && item.avatarUrl.startsWith('http') && !item.avatarUrl.includes('photo-1559839734')) {
    return item.avatarUrl;
  }
  if (item.avatar && item.avatar.startsWith('http') && !item.avatar.includes('photo-1559839734')) {
    return item.avatar;
  }
  const nameLower = (item.fullName || item.name || '').toLowerCase();
  if (nameLower.includes('morales')) return FALLBACK_CHAPLAIN_ROSTER[0].avatar;
  if (nameLower.includes('alvarez') || nameLower.includes('álvarez')) return FALLBACK_CHAPLAIN_ROSTER[1].avatar;
  if (nameLower.includes('vazquez') || nameLower.includes('vázquez')) return FALLBACK_CHAPLAIN_ROSTER[2].avatar;
  if (nameLower.includes('godoy')) return DEFAULT_FORCE_PORTRAIT;
  return DEFAULT_FORCE_PORTRAIT;
}

interface ChaplainRosterWidgetProps {
  chaplainTeam: ChaplainTeamMember[];
  onSelectChat?: (item: any) => void;
  onSelectCall?: (item: any) => void;
}

export function ChaplainRosterWidget({
  chaplainTeam,
  onSelectChat,
  onSelectCall,
}: ChaplainRosterWidgetProps) {
  const rosterData = chaplainTeam.length > 0 ? chaplainTeam : FALLBACK_CHAPLAIN_ROSTER;

  return (
    <View style={styles.rosterSection}>
      <View style={styles.rosterSectionHeader}>
        <Text style={styles.rosterSectionTitle}>Nuestros Capellanes</Text>
        <Text style={styles.rosterSectionBadge}>
          {chaplainTeam.length > 0 ? `${chaplainTeam.length} EN EQUIPO` : '3 DISPONIBLES'}
        </Text>
      </View>

      <View style={styles.rosterList}>
        {rosterData.map((item: any) => {
          const id = item.userId || item.id;
          const name = item.fullName || item.name;
          const branch = item.militaryForce || item.branch || 'Capellanía';
          const specialty =
            item.bio ||
            item.specialty ||
            (item.militaryRank ? `Rango: ${item.militaryRank}` : 'Asistencia pastoral y contención');
          const avatar = resolveChaplainAvatar(item);
          const isOnline = item.status === 'ONLINE' || !item.status;

          return (
            <TacticalCard
              key={id}
              style={styles.chaplainCard}
              padding={10}
            >
              <View style={styles.chaplainRow}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={{ uri: avatar }}
                    style={styles.avatarImage}
                    defaultSource={{ uri: DEFAULT_FORCE_PORTRAIT }}
                  />
                  <View
                    style={[
                      styles.onlineDot,
                      !isOnline && { backgroundColor: '#94A3B8' },
                    ]}
                  />
                </View>

                <View style={styles.chaplainInfo}>
                  <View style={styles.branchTag}>
                    <Text style={styles.branchTagText}>{branch}</Text>
                  </View>
                  <View style={styles.chaplainNameRow}>
                    <Text style={styles.chaplainName}>{name}</Text>
                  </View>
                  <View>
                    <Text style={styles.chaplainSpecialty} numberOfLines={2}>
                      {specialty}
                    </Text>
                  </View>
                </View>

                {(onSelectChat || onSelectCall) && (
                  <View style={styles.chaplainActionButtons}>
                    {onSelectChat && (
                      <TouchableOpacity
                        style={styles.chatIconButton}
                        onPress={() => onSelectChat(item)}
                        activeOpacity={0.7}
                      >
                        <MessageSquare size={16} color={Theme.colors.tacticalNavy} />
                      </TouchableOpacity>
                    )}
                    {onSelectCall && (
                      <TouchableOpacity
                        style={styles.callIconButton}
                        onPress={() => onSelectCall(item)}
                        activeOpacity={0.7}
                      >
                        <Video size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </TacticalCard>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rosterSection: {},
  rosterSectionHeader: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  rosterSectionTitle: {
    fontFamily: Theme.fonts.headline,
    fontSize: 17,
    color: Theme.colors.onSurface,
  },
  rosterSectionBadge: {
    ...globalStyles.labelCaps,
    color: Theme.colors.secondary,
    fontSize: 11,
  },
  rosterList: {
    gap: 10,
  },
  chaplainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  chaplainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  chaplainInfo: {
    flex: 1,
    minWidth: 0,
  },
  chaplainNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chaplainName: {
    fontFamily: Theme.fonts.bodySemiBold,
    fontSize: 13,
    color: Theme.colors.onSurface,
  },
  branchTag: {
    paddingVertical: 1,
    borderRadius: 3,
  },
  branchTagText: {
    borderRadius: 4,
    backgroundColor: Theme.colors.surfaceContainer,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    ...globalStyles.labelCaps,
    fontSize: 8,
    color: Theme.colors.onSurfaceVariant,
  },
  chaplainSpecialty: {
    ...globalStyles.bodySm,
    fontSize: 11,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  chaplainActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  chatIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.tacticalNavy,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
