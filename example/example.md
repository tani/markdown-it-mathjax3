# Homomorphism

# Definition
A homomorphism is a map between tow algebraic structures of the same type (that is of the same name), that preserves the operations of the structures. This means a map $f:A\to B$ between two sets $A$, $B$ equipped with the same structure such that, if $\cdot$ is an operation of the structure (supposed here, for simplification, to be a binary operation), then
$$f(x\cdot y)=f(x)\cdot f(y)$$
for every pair $x$, $y$ of element of $A$. One says often that $f$ preserves the operation or is compatible with the operation.

Formally, a map $f:A\to B$ preserves an operation $\mu$ of arity $\mathsf{k}$, defined on both $A$ and $B$ if 
$$f(\mu_A(a_1,\ldots,a_k))=\mu_B(f(a_1),\ldots,f(a_k))$$
,for all elements $a_1,\ldots,a_k$ in $A$.

