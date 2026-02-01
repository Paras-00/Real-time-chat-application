import React, { useState } from 'react';

const ProfileSetup = ({ onComplete }) => {
    const [username, setUsername] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [preview, setPreview] = useState(null);

    // Initial avatars if user doesn't want to upload
    const defaultAvatars = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Zack',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=Coco'
    ];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSelectDefault = (url) => {
        setAvatar(url);
        setPreview(url);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim()) return;

        let finalAvatarUrl = preview;

        // If it's a file, upload it first (skipping for now to stick to session/url or simplified flow)
        // For simplicity in this non-auth session-based version:
        // We will just use the preview/blob URL locally or base64? 
        // Actually best to assume string URL for defaults, and just local blob for file temporarily
        // OR better: Upload to server if it's a file.

        if (avatar instanceof File) {
            const formData = new FormData();
            formData.append('file', avatar);
            try {
                const res = await fetch('http://localhost:5000/api/upload', { method: 'POST', body: formData });
                const data = await res.json();
                finalAvatarUrl = `http://localhost:5000${data.fileUrl}`;
            } catch (err) {
                console.error(err);
            }
        }

        onComplete({ username, avatar: finalAvatarUrl || defaultAvatars[0] });
    };

    return (
        <div className="profile-setup-container">
            <div className="profile-box">
                <h2>Welcome to Linksy</h2>
                <p>Create your identity</p>

                <div className="avatar-selection">
                    <div className="current-avatar">
                        <img src={preview || defaultAvatars[0]} alt="Avatar" />
                    </div>
                    <div className="avatar-options">
                        {defaultAvatars.map(url => (
                            <img key={url} src={url} onClick={() => handleSelectDefault(url)} className="avatar-option" />
                        ))}
                        <label className="upload-btn">
                            📷 Upload
                            <input type="file" onChange={handleFileChange} accept="image/*" hidden />
                        </label>
                    </div>
                </div>

                <input
                    type="text"
                    placeholder="Enter your display name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="name-input"
                />

                <button className="join-btn" onClick={handleSubmit} disabled={!username}>Join Workspace</button>
            </div>

            <style>{`
                .profile-setup-container {
                    position: fixed; top:0; left:0; width:100%; height:100%;
                    background: #1e1e1e; display: flex; align-items: center; justify-content: center;
                    z-index: 1000;
                }
                .profile-box {
                    background: #252526; padding: 40px; border-radius: 10px;
                    text-align: center; border: 1px solid #333; width: 400px;
                }
                .avatar-selection { display: flex; flex-direction: column; align-items: center; gap: 15px; margin: 20px 0; }
                .current-avatar img { width: 100px; height: 100px; border-radius: 50%; border: 3px solid #007acc; object-fit: cover; }
                .avatar-options { display: flex; gap: 10px; justify-content: center; }
                .avatar-option { width: 40px; height: 40px; border-radius: 50%; cursor: pointer; opacity: 0.6; transition: 0.2s; }
                .avatar-option:hover { opacity: 1; transform: scale(1.1); }
                .upload-btn { cursor: pointer; background: #333; padding: 5px 10px; border-radius: 5px; font-size: 0.8rem; }
                .name-input { width: 100%; padding: 10px; background: #333; border: 1px solid #444; color: white; border-radius: 5px; margin-bottom: 20px; text-align: center; }
                .join-btn { background: #007acc; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%; }
                .join-btn:disabled { background: #444; cursor: not-allowed; }
            `}</style>
        </div>
    );
};

export default ProfileSetup;
