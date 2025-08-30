import { Fragment, useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { PageNavbar } from '@/pages/account';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
} from '@/partials/common/toolbar';
import { Container } from '@/components/common/container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Building2, 
  Calendar, 
  DollarSign,
  Edit,
  Trash2,
  Eye,
  FileText,
  MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Project } from '../../../../shared/types';

export function ProjectsListPage() {
  const { theme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.data.projects || []);
      }
    } catch (error) {
      console.error('Projeler yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getFaqCount = (project: Project) => {
    if (!project.faq_json) return 0;
    return Object.keys(project.faq_json).length;
  };

  const getDocsCount = (project: Project) => {
    if (!project.docs_json) return 0;
    return Object.keys(project.docs_json).length;
  };

  if (loading) {
    return (
      <Fragment>
        <PageNavbar />
        <Container>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Projeler yükleniyor...</p>
            </div>
          </div>
        </Container>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <PageNavbar />
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <h1 className="text-2xl font-bold">Projeler</h1>
            <p className="text-sm text-gray-500">
              AI asistanın kullanacağı proje bilgilerini yönetin
            </p>
          </ToolbarHeading>
          <ToolbarActions>
            <Button asChild>
              <Link to="/crm/projects/new">
                <Plus className="w-4 h-4 mr-2" />
                Yeni Proje
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Proje ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredProjects.map((project) => (
             <Card key={project.id} className={`p-6 transition-shadow ${
               theme === 'dark' 
                 ? 'hover:shadow-lg hover:shadow-zinc-800/50' 
                 : 'hover:shadow-lg'
             }`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <Building2 className="w-8 h-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(project.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/crm/projects/${project.id}`}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/crm/projects/${project.id}/edit`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>

                             {project.description && (
                 <p className={`mb-4 line-clamp-2 ${
                   theme === 'dark' ? 'text-zinc-300' : 'text-gray-600'
                 }`}>
                   {project.description}
                 </p>
               )}

               <div className="space-y-2">
                 {project.price_range && (
                   <div className={`flex items-center text-sm ${
                     theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                   }`}>
                     <DollarSign className="w-4 h-4 mr-2" />
                     {project.price_range}
                   </div>
                 )}
                 
                 {project.delivery_date && (
                   <div className={`flex items-center text-sm ${
                     theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                   }`}>
                     <Calendar className="w-4 h-4 mr-2" />
                     Teslim: {formatDate(project.delivery_date)}
                   </div>
                 )}

                 {project.address && (
                   <div className={`text-sm ${
                     theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
                   }`}>
                     📍 {project.address}
                   </div>
                 )}
               </div>

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                                 <div className={`flex items-center space-x-4 text-sm ${
                 theme === 'dark' ? 'text-zinc-400' : 'text-gray-600'
               }`}>
                 {getFaqCount(project) > 0 && (
                   <div className="flex items-center">
                     <MessageSquare className="w-4 h-4 mr-1" />
                     <span>{getFaqCount(project)} SSS</span>
                   </div>
                 )}
                 {getDocsCount(project) > 0 && (
                   <div className="flex items-center">
                     <FileText className="w-4 h-4 mr-1" />
                     <span>{getDocsCount(project)} Doküman</span>
                   </div>
                 )}
               </div>
                  <Badge variant="secondary">
                    ID: {project.id}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/crm/projects/${project.id}`}>
                    Detayları Gör
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>

                 {filteredProjects.length === 0 && (
           <div className="text-center py-12">
             <Building2 className={`w-16 h-16 mx-auto mb-4 ${
               theme === 'dark' ? 'text-zinc-600' : 'text-gray-300'
             }`} />
             <h3 className={`text-lg font-medium mb-2 ${
               theme === 'dark' ? 'text-zinc-100' : 'text-gray-900'
             }`}>
               Henüz proje yok
             </h3>
             <p className={`mb-6 ${
               theme === 'dark' ? 'text-zinc-400' : 'text-gray-500'
             }`}>
               İlk projenizi oluşturarak başlayın
             </p>
             <Button asChild>
               <Link to="/crm/projects/new">
                 <Plus className="w-4 h-4 mr-2" />
                 İlk Projeyi Oluştur
               </Link>
             </Button>
           </div>
         )}
      </Container>
    </Fragment>
  );
}
