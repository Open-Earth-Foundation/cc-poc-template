import { User } from "@/core/types/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { User as UserIcon, Mail, Briefcase, FolderOpen } from "lucide-react";

interface UserDataCardProps {
  user: User;
}

export function UserDataCard({ user }: UserDataCardProps) {
  return (
    <Card className="w-full" data-testid="card-user-data">
      <CardHeader>
        <CardTitle className="flex items-center gap-2" data-testid="text-user-data-title">
          <UserIcon className="h-5 w-5" />
          User Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Name</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6" data-testid="text-user-name">
              {user.name}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6" data-testid="text-user-email">
              {user.email}
            </p>
          </div>
        </div>

        {/* User Title */}
        {user.title && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Title</span>
            </div>
            <p className="text-sm text-muted-foreground pl-6" data-testid="text-user-title">
              {user.title}
            </p>
          </div>
        )}

        {/* User ID */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">User ID</span>
          </div>
          <p className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded" data-testid="text-user-id">
            {user.id}
          </p>
        </div>

        {/* Projects */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Projects ({user.projects.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pl-6" data-testid="container-user-projects">
            {user.projects.map((projectId) => (
              <Badge 
                key={projectId} 
                variant="secondary" 
                className="text-xs"
                data-testid={`badge-project-${projectId}`}
              >
                {projectId.replace('project-', '').replace('-', ' ').split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}