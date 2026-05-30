-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    genre TEXT,
    logline TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: scenes
CREATE TABLE IF NOT EXISTS scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('scene_heading', 'action', 'character', 'dialogue', 'parenthetical')),
    content TEXT NOT NULL DEFAULT '',
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: scene_versions
CREATE TABLE IF NOT EXISTS scene_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scene_id UUID NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    author TEXT NOT NULL CHECK(author IN ('human', 'ai')),
    model TEXT -- e.g. 'claude', 'gpt', null for human
);

-- Table: contribution_logs
CREATE TABLE IF NOT EXISTS contribution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor TEXT NOT NULL CHECK(actor IN ('human', 'ai')),
    model TEXT,
    action_type TEXT NOT NULL CHECK(action_type IN ('generate', 'edit', 'rewrite')),
    content_delta INTEGER NOT NULL,
    node_type TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- projects: users can perform any action on their own projects
CREATE POLICY "Users own their projects"
ON projects FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- scenes: users can perform any action if they own the parent project
CREATE POLICY "Users own their scenes"
ON scenes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = scenes.project_id AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = scenes.project_id AND projects.user_id = auth.uid()
    )
);

-- scene_versions: users can perform any action if they own the parent project of the scene
CREATE POLICY "Users own their scene_versions"
ON scene_versions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM scenes
        JOIN projects ON projects.id = scenes.project_id
        WHERE scenes.id = scene_versions.scene_id AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM scenes
        JOIN projects ON projects.id = scenes.project_id
        WHERE scenes.id = scene_versions.scene_id AND projects.user_id = auth.uid()
    )
);

-- contribution_logs: users can perform any action if they own the project and log matches their user_id
CREATE POLICY "Users own their contribution_logs"
ON contribution_logs FOR ALL
USING (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = contribution_logs.project_id AND projects.user_id = auth.uid()
    )
)
WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = contribution_logs.project_id AND projects.user_id = auth.uid()
    )
);
