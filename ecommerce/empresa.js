// ==================== EMPRESAS DATA ====================
const defaultEmpresas = [
    {
        id: 1,
        name: 'E-Commerce',
        cnpj: '00.000.000/0001-00',
        address: 'Rua Exemplo, 123 - Centro',
        phone: '(00) 0000-0000',
        emoji: '🛒'
    }
];

let empresas = JSON.parse(localStorage.getItem('empresas')) || [...defaultEmpresas];
let empresaAtiva = JSON.parse(localStorage.getItem('empresaAtiva')) || empresas[0] || null;
let empresaCounter = parseInt(localStorage.getItem('empresaCounter')) || 2;

function saveEmpresas() {
    localStorage.setItem('empresas', JSON.stringify(empresas));
    localStorage.setItem('empresaCounter', empresaCounter.toString());
}

function saveEmpresaAtiva() {
    localStorage.setItem('empresaAtiva', JSON.stringify(empresaAtiva));
}

function addEmpresa(empresa) {
    empresa.id = empresaCounter++;
    empresas.push(empresa);
    saveEmpresas();
    return empresa;
}

function updateEmpresa(id, data) {
    const index = empresas.findIndex(e => e.id === id);
    if (index !== -1) {
        empresas[index] = { ...empresas[index], ...data };
        saveEmpresas();
        if (empresaAtiva && empresaAtiva.id === id) {
            empresaAtiva = empresas[index];
            saveEmpresaAtiva();
        }
        return empresas[index];
    }
    return null;
}

function deleteEmpresa(id) {
    const index = empresas.findIndex(e => e.id === id);
    if (index !== -1) {
        empresas.splice(index, 1);
        saveEmpresas();
        if (empresaAtiva && empresaAtiva.id === id) {
            empresaAtiva = empresas[0] || null;
            saveEmpresaAtiva();
        }
        return true;
    }
    return false;
}

function setEmpresaAtiva(id) {
    const empresa = empresas.find(e => e.id === id);
    if (empresa) {
        empresaAtiva = empresa;
        saveEmpresaAtiva();
        return empresa;
    }
    return null;
}

function getEmpresaAtiva() {
    return empresaAtiva;
}

function getAllEmpresas() {
    return empresas;
}
