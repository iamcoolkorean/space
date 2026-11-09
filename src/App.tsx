import { useState, useEffect, useCallback } from 'react';
import { Space, Profile, SpaceFormData, AuthSessionUser } from './types';
import {
  getProfile,
  saveProfile,
  createInitialProfile,
  getSpaces,
  addSpace,
  updateSpace,
  deleteSpace,
} from './lib/store';
import {
  getAuthSession,
  getAuthSessionSync,
  signOutUser,
  getSupabaseClient,
} from './lib/supabase';
import { Header } from './components/Header';
import { SpaceList } from './components/SpaceList';
import { SpaceDetail } from './components/SpaceDetail';
import { SpaceForm } from './components/SpaceForm';
import { AuthModal } from './components/AuthModal';
import { InitialProfileModal } from './components/InitialProfileModal';
import { ProfileEditModal } from './components/ProfileEditModal';
import { LightboxModal } from './components/LightboxModal';

export default function App() {
  // Query parameters: ?u=slug&mode=view
  const [slugParam, setSlugParam] = useState<string | null>(null);
  const [isViewMode, setIsViewMode] = useState<boolean>(false);

  // Auth state
  const [currentUser, setCurrentUser] = useState<AuthSessionUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isInitialProfileModalOpen, setIsInitialProfileModalOpen] = useState<boolean>(false);

  // App data state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // View routing state
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);

  // Profile edit modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string | undefined>(undefined);

  // Parse URL search params once on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const u = params.get('u');
    const mode = params.get('mode');

    if (u) setSlugParam(u);
    if (mode === 'view') setIsViewMode(true);
  }, []);

  // Check auth session
  const checkAuth = useCallback(async () => {
    const { user } = await getAuthSession();
    if (user) {
      const authUser: AuthSessionUser = {
        id: user.id,
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url,
        full_name: user.user_metadata?.full_name,
      };
      setCurrentUser(authUser);
      return authUser;
    } else {
      setCurrentUser(null);
      return null;
    }
  }, []);

  // Check auth session on mount & subscribe to Supabase Auth state changes
  useEffect(() => {
    checkAuth();

    const client = getSupabaseClient();
    if (client) {
      const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setCurrentUser({
            id: session.user.id,
            email: session.user.email,
            avatar_url: session.user.user_metadata?.avatar_url,
            full_name: session.user.user_metadata?.full_name,
          });
        } else {
          // If a local demo curator session is active, do not overwrite with null
          const { user: localUser } = getAuthSessionSync();
          if (!localUser) {
            setCurrentUser(null);
          }
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [checkAuth]);

  // Load profile and spaces based on slug or current user
  const loadData = useCallback(async (forcedUser?: AuthSessionUser | null) => {
    setIsLoading(true);
    try {
      const targetSlug = slugParam || undefined;
      const effectiveUser = forcedUser !== undefined ? forcedUser : currentUser;
      const targetUserId = !targetSlug && effectiveUser ? effectiveUser.id : undefined;

      let prof = await getProfile(targetSlug, targetUserId);

      // If user is logged in, but has no profile row yet (first-time login), prompt setup
      if (!prof && effectiveUser) {
        setIsInitialProfileModalOpen(true);
        setIsLoading(false);
        return;
      }

      // If still no profile, fallback to default seed
      if (!prof) {
        prof = await getProfile();
      }

      setProfile(prof);

      if (prof) {
        const sps = await getSpaces(prof.id);
        setSpaces(sps);
      }
    } catch (err) {
      console.error('Failed to load portfolio data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [slugParam, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ownership evaluation: user is owner if logged in and user.id matches profile.id
  const isOwner = Boolean(
    currentUser && profile && currentUser.id === profile.id
  );

  const handleAuthSuccess = async (authUser?: any) => {
    let resolvedUser = authUser;
    if (!resolvedUser) {
      resolvedUser = await checkAuth();
    } else {
      setCurrentUser(resolvedUser);
    }
    await loadData(resolvedUser);
  };

  const handleLogout = async () => {
    await signOutUser();
    setCurrentUser(null);
    setSelectedSpace(null);
    setIsFormOpen(false);
    loadData();
  };

  const handleInitialProfileCreated = async (title: string, slug: string, bio: string) => {
    if (!currentUser) return;
    const newProfile = await createInitialProfile(currentUser.id, title, slug, bio);
    setProfile(newProfile);
    setIsInitialProfileModalOpen(false);
    const sps = await getSpaces(newProfile.id);
    setSpaces(sps);
  };

  // Space Form Actions (Owner only)
  const handleOpenAddForm = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!isOwner) return;
    setEditingSpace(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (space: Space) => {
    if (!isOwner) return;
    setEditingSpace(space);
    setIsFormOpen(true);
  };

  const handleSaveSpace = async (formData: SpaceFormData) => {
    if (!profile || !isOwner) return;

    if (editingSpace) {
      const updated = await updateSpace(editingSpace.id, formData);
      setSpaces((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      if (selectedSpace?.id === updated.id) {
        setSelectedSpace(updated);
      }
    } else {
      const created = await addSpace(formData, profile.id);
      setSpaces((prev) => [created, ...prev]);
    }

    setIsFormOpen(false);
    setEditingSpace(null);
  };

  const handleDeleteSpace = async (spaceId: string) => {
    if (!isOwner) return;
    await deleteSpace(spaceId);
    setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
    setSelectedSpace(null);
  };

  const handleSaveProfile = async (updates: Partial<Profile>) => {
    if (!isOwner) return;
    const updated = await saveProfile(updates);
    setProfile(updated);
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center text-white">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-widest text-zinc-400 uppercase">
          SPACE ARCHIVE 로딩 중...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-100 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        portfolioTitle={profile.portfolio_title}
        slug={profile.slug}
        currentUser={currentUser}
        isOwner={isOwner}
        isViewMode={isViewMode}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={handleLogout}
        onAddSpaceClick={handleOpenAddForm}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isFormOpen ? (
          <SpaceForm
            initialSpace={editingSpace}
            onSave={handleSaveSpace}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingSpace(null);
            }}
          />
        ) : selectedSpace ? (
          <SpaceDetail
            space={selectedSpace}
            isOwner={isOwner}
            isViewMode={isViewMode}
            onBack={() => setSelectedSpace(null)}
            onEdit={handleOpenEditForm}
            onDelete={handleDeleteSpace}
            onOpenLightbox={(url, caption) => {
              setLightboxUrl(url);
              setLightboxCaption(caption);
            }}
          />
        ) : (
          <SpaceList
            profile={profile}
            spaces={spaces}
            onSelectSpace={(space) => setSelectedSpace(space)}
            isOwner={isOwner}
            isViewMode={isViewMode}
            onEditProfileClick={() => setIsProfileModalOpen(true)}
          />
        )}
      </main>

      {/* Lightbox Modal */}
      <LightboxModal
        imageUrl={lightboxUrl}
        altText={lightboxCaption}
        onClose={() => setLightboxUrl(null)}
      />

      {/* Supabase Auth Modal (OAuth & Email) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* First-Time Profile Creation Modal */}
      <InitialProfileModal
        isOpen={isInitialProfileModalOpen}
        userId={currentUser?.id || ''}
        userEmail={currentUser?.email}
        onProfileCreated={handleInitialProfileCreated}
      />

      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        profile={profile}
        onSave={handleSaveProfile}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
}
