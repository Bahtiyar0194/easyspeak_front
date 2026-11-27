// Названия для «хлебных крошек» вместо параметров адреса ([course], [lesson]…).
//
// Раньше каждая страница после загрузки меняла текст крошки прямо в разметке
// (document.querySelector(...).textContent), а до этого в навигации было видно
// «[course]». Теперь страница сообщает названия сюда, а breadcrumb.vue
// показывает их; пока названия нет — скелетон.
//
// Название хранится вместе со значением параметра (course:english), поэтому
// при переходе на другой урок не мелькает название предыдущего.
//
//   const { setCrumbLabels } = useCrumbLabels();
//   setCrumbLabels({ course: "English", level: "A1" });
export const useCrumbLabels = () => {
  const labels = useState("crumbLabels", () => ({}));
  const route = useRoute();

  const keyOf = (param, value) => `${param}:${value}`;

  const setCrumbLabels = (values) => {
    const next = { ...labels.value };
    for (const [param, label] of Object.entries(values)) {
      const value = route.params[param];
      if (value !== undefined && label) next[keyOf(param, value)] = String(label);
    }
    labels.value = next;
  };

  const labelFor = (param, value) => labels.value[keyOf(param, value)] || "";

  return { labels, setCrumbLabels, labelFor };
};
