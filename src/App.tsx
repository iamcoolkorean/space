import { useState, useEffect, useCallback } from 'react';
import { Space, SpaceFormData } from './types';
import {
  isAdminAuthenticated,
  setAdminAuthenticated,
  fetchSpacesData,
  commitSpacesJson,
  deleteImageFromGitHub,
} from './lib/github';
import { Header } from './components/Header';
import { SpaceList } from './components/SpaceList';
import { SpaceDetail } from './components/SpaceDetail';
import { SpaceForm } from './components/SpaceForm';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { LightboxModal } from './components/LightboxModal';

export default function App() {
  // Query parameter: ?mode=view
  const [isViewMode, setIsViewMode] = useState<boolean>(false);

  // Admin authentication state (stored in localStorage)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAdminAuthenticated());
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);

  // Spaces data state
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Main feed column layout state (Default: 2-column grid)
  const [columns, setColumns] = useState<1 | 2>(2);

  // View routing state
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string | undefined>(undefined);

  // Check ?mode=view on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'view') {
      setIsViewMode(true);
    }
  }, []);

  // Load spaces data from public/data/spaces.json or GitHub Contents API
  const loadSpaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const { spaces: loaded } = await fetchSpacesData();
      setSpaces(loaded);
    } catch (err) {
      console.error('Failed to load spaces:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);

  // Lock icon toggle handler
  const handleLockToggleClick = () => {
    if (isAdmin) {
      // Toggle off (Logout)
      setAdminAuthenticated(false);
      setIsAdmin(false);
      setIsFormOpen(false);
      setEditingSpace(null);
    } else {
      // Open password verification modal
      setIsPasswordModalOpen(true);
    }
  };

  const handleOpenAddForm = () => {
    if (!isAdmin) {
      setIsPasswordModalOpen(true);
      return;
    }
    setEditingSpace(null);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (space: Space) => {
    if (!isAdmin) return;
    setEditingSpace(space);
    setIsFormOpen(true);
  };

  const handleSaveSpace = async (formData: SpaceFormData) => {
    if (!isAdmin) return;

    if (editingSpace) {
      const updatedSpace: Space = {
        ...editingSpace,
        ...formData,
        updated_at: new Date().toISOString(),
      };
      const updatedList = spaces.map((s) =>
        s.id === updatedSpace.id ? updatedSpace : s
      );

      await commitSpacesJson(updatedList, `feat(space): update ${updatedSpace.name}`);
      setSpaces(updatedList);
      if (selectedSpace?.id === updatedSpace.id) {
        setSelectedSpace(updatedSpace);
      }
    } else {
      const newSpace: Space = {
        id: `space-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: formData.name.trim(),
        location: formData.location.trim(),
        tags: formData.tags,
        comment: formData.comment.trim(),
        main_image_url: formData.main_image_url,
        sub_image_urls: formData.sub_image_urls,
        created_at: new Date().toISOString(),
      };
      const updatedList = [newSpace, ...spaces];

      await commitSpacesJson(updatedList, `feat(space): add ${newSpace.name}`);
      setSpaces(updatedList);
    }

    setIsFormOpen(false);
    setEditingSpace(null);
  };

  const handleDeleteSpace = async (spaceId: string) => {
    if (!isAdmin) return;

    const target = spaces.find((s) => s.id === spaceId);
    const updatedList = spaces.filter((s) => s.id !== spaceId);

    // Clean up associated images in GitHub repository if applicable
    if (target) {
      const imagesToRemove = [
        target.main_image_url,
        ...(target.sub_image_urls || []),
      ].filter(Boolean);
      for (const imgUrl of imagesToRemove) {
        await deleteImageFromGitHub(imgUrl);
      }
    }

    await commitSpacesJson(
      updatedList,
      `chore(space): delete ${target ? target.name : spaceId}`
    );

    setSpaces(updatedList);
    setSelectedSpace(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6 text-center text-white font-sans">
        <div className="w-8 h-8 border-2 border-[#27272A] border-t-[#2563EB] animate-spin mb-4" />
        <p className="text-xs font-semibold tracking-widest text-[#A1A1AA] uppercase">
          SPACE ARCHIVE LOADING...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Top Header */}
      <Header
        columns={columns}
        onChangeColumns={setColumns}
        isAdmin={isAdmin}
        isViewMode={isViewMode}
        onLockToggleClick={handleLockToggleClick}
        onAddSpaceClick={handleOpenAddForm}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
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
            isAdmin={isAdmin}
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
            spaces={spaces}
            columns={columns}
            onChangeColumns={setColumns}
            onSelectSpace={(space) => setSelectedSpace(space)}
            isAdmin={isAdmin}
            isViewMode={isViewMode}
            onAddSpaceClick={handleOpenAddForm}
          />
        )}
      </main>

      {/* Admin Password Verification Modal */}
      <AdminPasswordModal
        isOpen={isPasswordModalOpen}
        onSuccess={() => setIsAdmin(true)}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* Fullscreen Lightbox Modal */}
      <LightboxModal
        imageUrl={lightboxUrl}
        altText={lightboxCaption}
        onClose={() => setLightboxUrl(null)}
      />
    </div>
  );
}
